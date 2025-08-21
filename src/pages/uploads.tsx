
import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Users, TrendingUp, Download, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadHistoryDialog } from "@/components/upload-history-dialog";
import { useAuth } from "@/hooks/use-auth";

interface CSVRow {
  full_name: string;
  national_id?: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;
  farm_size_acres?: number;
  farmer_group_id: string;
  [key: string]: any;
}

interface UploadResult {
  success: number;
  errors: string[];
  total: number;
}

// Simple CSV parser function
const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
};

export default function Uploads() {
  const { user } = useAuth();
  const [showFarmerUpload, setShowFarmerUpload] = useState(false);
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing data for validation
  const { data: existingFarmers } = useQuery({
    queryKey: ["existing-farmers"],
    queryFn: async () => {
      const { data } = await supabase.from("farmers").select("national_id, phone");
      return data || [];
    },
  });

  const { data: existingClubs } = useQuery({
    queryKey: ["existing-clubs"],
    queryFn: async () => {
      const { data } = await supabase.from("farmer_groups").select("id, name");
      return data || [];
    },
  });

  // Create upload history record
  const createUploadHistory = async (uploadData: {
    upload_type: 'farmers' | 'contracts' | 'loans' | 'equipment';
    file_name: string;
    file_size: number;
    total_records: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }) => {
    const { data, error } = await supabase
      .from("upload_history")
      .insert([{
        user_id: user?.id,
        ...uploadData,
        successful_records: 0,
        failed_records: 0,
        error_details: null,
      }])
      .select()
      .single();

    if (error) {
      console.error("Failed to create upload history:", error);
      return null;
    }

    return data;
  };

  // Update upload history record
  const updateUploadHistory = async (historyId: string, updateData: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    successful_records?: number;
    failed_records?: number;
    error_details?: any;
    completed_at?: string;
  }) => {
    const { error } = await supabase
      .from("upload_history")
      .update({
        ...updateData,
        completed_at: updateData.completed_at || new Date().toISOString(),
      })
      .eq("id", historyId);

    if (error) {
      console.error("Failed to update upload history:", error);
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: CSVRow[]) => {
      const results: UploadResult = { success: 0, errors: [], total: data.length };
      
      // Create upload history record
      const historyRecord = await createUploadHistory({
        upload_type: 'farmers',
        file_name: selectedFile?.name || 'unknown.csv',
        file_size: selectedFile?.size || 0,
        total_records: data.length,
        status: 'processing',
      });

      if (!historyRecord) {
        throw new Error("Failed to create upload history record");
      }

      // Update status to processing
      await updateUploadHistory(historyRecord.id, { status: 'processing' });
      
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Validate required fields
          if (!row.full_name || !row.phone || !row.farmer_group_id) {
            results.errors.push(`Row ${i + 1}: Missing required fields`);
            continue;
          }

          // Check for duplicate national ID
          if (row.national_id && existingFarmers?.some(f => f.national_id === row.national_id)) {
            results.errors.push(`Row ${i + 1}: National ID already exists`);
            continue;
          }

          // Check for duplicate phone
          if (existingFarmers?.some(f => f.phone === row.phone)) {
            results.errors.push(`Row ${i + 1}: Phone number already exists`);
            continue;
          }

          // Validate club exists
          if (!existingClubs?.some(c => c.id === row.farmer_group_id)) {
            results.errors.push(`Row ${i + 1}: Invalid farmer group ID`);
            continue;
          }

          // Insert farmer
          const { error } = await supabase.from("farmers").insert([{
            full_name: row.full_name,
            national_id: row.national_id || null,
            phone: row.phone,
            gender: row.gender || null,
            date_of_birth: row.date_of_birth || null,
            farm_size_acres: row.farm_size_acres || null,
            farmer_group_id: row.farmer_group_id,
            created_by: user?.id
          }]);

          if (error) {
            results.errors.push(`Row ${i + 1}: ${error.message}`);
          } else {
            results.success++;
          }

          // Update progress
          setUploadProgress(((i + 1) / data.length) * 100);
        } catch (error) {
          results.errors.push(`Row ${i + 1}: Unexpected error`);
        }
      }

      // Update upload history with results
      await updateUploadHistory(historyRecord.id, {
        status: results.errors.length === 0 ? 'completed' : 'completed',
        successful_records: results.success,
        failed_records: results.errors.length,
        error_details: results.errors.length > 0 ? results.errors : null,
      });

      return results;
    },
    onSuccess: (results) => {
      if (results.success > 0) {
        toast.success(`Successfully uploaded ${results.success} farmers`);
        queryClient.invalidateQueries({ queryKey: ["existing-farmers"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["upload-history", user?.id] });
      }
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} errors occurred during upload`);
        setValidationErrors(results.errors);
      }
      setShowFarmerUpload(false);
      setUploadProgress(0);
      setCsvData([]);
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error("Upload failed");
      setUploadProgress(0);
    }
  });

  // Contract upload mutation
  const contractUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create upload history record
      const historyRecord = await createUploadHistory({
        upload_type: 'contracts',
        file_name: file.name,
        file_size: file.size,
        total_records: 1,
        status: 'processing',
      });

      if (!historyRecord) {
        throw new Error("Failed to create upload history record");
      }

      const fileName = `contracts/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) {
        await updateUploadHistory(historyRecord.id, {
          status: 'failed',
          error_details: [uploadError.message],
        });
        throw uploadError;
      }

      // Update upload history as successful
      await updateUploadHistory(historyRecord.id, {
        status: 'completed',
        successful_records: 1,
        failed_records: 0,
      });

      return fileName;
    },
    onSuccess: (fileName) => {
      toast.success("Contract uploaded successfully");
      setShowContractUpload(false);
      setContractFile(null);
      queryClient.invalidateQueries({ queryKey: ["upload-history", user?.id] });
    },
    onError: (error) => {
      toast.error("Contract upload failed");
    }
  });

  const handleFileSelect = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast.error("Please select a valid CSV file");
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedData = parseCSV(text);
      setCsvData(parsedData);
      validateData(parsedData);
    };
    reader.readAsText(file);
  };

  const validateData = (data: CSVRow[]) => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      if (!row.full_name) errors.push(`Row ${index + 1}: Missing full name`);
      if (!row.phone) errors.push(`Row ${index + 1}: Missing phone number`);
      if (!row.farmer_group_id) errors.push(`Row ${index + 1}: Missing farmer group ID`);
      
      if (row.national_id && existingFarmers?.some(f => f.national_id === row.national_id)) {
        errors.push(`Row ${index + 1}: National ID already exists`);
      }
      
      if (existingFarmers?.some(f => f.phone === row.phone)) {
        errors.push(`Row ${index + 1}: Phone number already exists`);
      }
      
      if (!existingClubs?.some(c => c.id === row.farmer_group_id)) {
        errors.push(`Row ${index + 1}: Invalid farmer group ID`);
      }
    });

    setValidationErrors(errors);
  };

  const handleUpload = () => {
    if (csvData.length === 0) {
      toast.error("No data to upload");
      return;
    }
    
    setUploading(true);
    uploadMutation.mutate(csvData);
  };

  const handleContractUpload = () => {
    if (!contractFile) {
      toast.error("Please select a contract file");
      return;
    }
    
    contractUploadMutation.mutate(contractFile);
  };

  const downloadTemplate = () => {
    const template = [
      {
        full_name: "John Doe",
        national_id: "123456789",
        phone: "+1234567890",
        gender: "male",
        date_of_birth: "1990-01-01",
        farm_size_acres: "10.5",
        farmer_group_id: "club-uuid-here"
      }
    ];

    const csv = [
      Object.keys(template[0]).join(','),
      ...template.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmer_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bulk Uploads</h1>
            <p className="text-muted-foreground">Upload CSV files and documents for bulk data import</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Farmer Lists
              </CardTitle>
              <CardDescription>Bulk upload farmer registration data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload CSV files containing farmer details, including names, national IDs, phone numbers, and club assignments.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowFarmerUpload(true)}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Farmers CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Upload
              </CardTitle>
              <CardDescription>Upload legal documents and contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload PDF contracts, agreements, and other legal documents for secure storage and access.
                </p>
                <Button 
                  onClick={() => setShowContractUpload(true)}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Upload History
              </CardTitle>
              <CardDescription>Track your upload activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View recent uploads, success rates, and any errors that occurred during the process.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(true)}
                  className="w-full"
                >
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farmer Upload Dialog */}
        <Dialog open={showFarmerUpload} onOpenChange={setShowFarmerUpload}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Farmers CSV</DialogTitle>
              <DialogDescription>
                Select a CSV file to upload farmer data. The file will be validated before import.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({selectedFile.size} bytes)
                  </p>
                )}
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Validation Errors ({validationErrors.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-sm text-orange-600">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Preview Table */}
              {csvData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Preview ({csvData.length} rows)</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>National ID</TableHead>
                          <TableHead>Gender</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.full_name}</TableCell>
                            <TableCell>{row.phone}</TableCell>
                            <TableCell>{row.national_id || '-'}</TableCell>
                            <TableCell>{row.gender || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {csvData.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      Showing first 5 rows of {csvData.length} total rows
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowFarmerUpload(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={csvData.length === 0 || uploading}
                >
                  {uploading ? "Uploading..." : "Upload Farmers"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contract Upload Dialog */}
        <Dialog open={showContractUpload} onOpenChange={setShowContractUpload}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Contract</DialogTitle>
              <DialogDescription>
                Select a contract file to upload to secure storage.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-file">Select File</Label>
                <Input
                  id="contract-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && setContractFile(e.target.files[0])}
                />
                {contractFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {contractFile.name} ({contractFile.size} bytes)
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowContractUpload(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContractUpload}
                  disabled={!contractFile}
                >
                  Upload Contract
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload History Dialog */}
        <UploadHistoryDialog open={showHistory} onOpenChange={setShowHistory} />

        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
            <CardDescription>Important information for successful data uploads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">CSV Format Requirements</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use UTF-8 encoding</li>
                  <li>• First row should contain column headers</li>
                  <li>• National IDs must be unique across farmers</li>
                  <li>• Phone numbers should include country code</li>
                  <li>• Date format: YYYY-MM-DD</li>
                  <li>• Required fields: full_name, phone, farmer_group_id</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Validation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All uploads are validated before import</li>
                  <li>• Preview screen shows potential issues</li>
                  <li>• Duplicate records are flagged</li>
                  <li>• Invalid data is highlighted for correction</li>
                  <li>• Upload history tracks all activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
