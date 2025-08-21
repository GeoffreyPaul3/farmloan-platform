import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  Download, 
  FileText, 
  Users, 
  Package, 
  CreditCard,
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye
} from "lucide-react";

interface UploadHistory {
  id: string;
  user_id: string;
  upload_type: 'farmers' | 'contracts' | 'loans' | 'equipment';
  file_name: string;
  file_size: number;
  total_records: number;
  successful_records: number;
  failed_records: number;
  error_details: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at: string;
  created_at: string;
}

const getUploadTypeIcon = (type: UploadHistory['upload_type']) => {
  switch (type) {
    case 'farmers':
      return <Users className="h-4 w-4" />;
    case 'contracts':
      return <FileText className="h-4 w-4" />;
    case 'loans':
      return <CreditCard className="h-4 w-4" />;
    case 'equipment':
      return <Package className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: UploadHistory['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case 'processing':
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
    case 'pending':
      return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

interface UploadHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadHistoryDialog({ open, onOpenChange }: UploadHistoryDialogProps) {
  const { user } = useAuth();
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);

  const { data: uploadHistory = [], isLoading } = useQuery({
    queryKey: ["upload-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upload_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as UploadHistory[];
    },
    enabled: !!user?.id && open,
  });

  const handleViewDetails = (upload: UploadHistory) => {
    setSelectedUpload(upload);
  };

  const handleCloseDetails = () => {
    setSelectedUpload(null);
  };

  const getSuccessRate = (upload: UploadHistory) => {
    if (upload.total_records === 0) return 0;
    return Math.round((upload.successful_records / upload.total_records) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload History</DialogTitle>
          <DialogDescription>
            Track your recent bulk upload activities and their results.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : uploadHistory.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No upload history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Total Uploads</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{uploadHistory.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Successful</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {uploadHistory.filter(u => u.status === 'completed').length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {uploadHistory.filter(u => u.status === 'failed').length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold">Processing</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {uploadHistory.filter(u => u.status === 'processing' || u.status === 'pending').length}
                </p>
              </div>
            </div>

            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadHistory.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getUploadTypeIcon(upload.upload_type)}
                          <span className="capitalize">{upload.upload_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{upload.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(upload.file_size)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(upload.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{upload.successful_records} / {upload.total_records}</p>
                          {upload.failed_records > 0 && (
                            <p className="text-red-600 text-xs">
                              {upload.failed_records} failed
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${getSuccessRate(upload)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{getSuccessRate(upload)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(upload.created_at)}</p>
                          {upload.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {formatDate(upload.completed_at)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(upload)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Upload Details Dialog */}
        {selectedUpload && (
          <Dialog open={!!selectedUpload} onOpenChange={handleCloseDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Details</DialogTitle>
                <DialogDescription>
                  Detailed information about this upload
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Upload Type</label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedUpload.upload_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUpload.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">File Name</label>
                    <p className="text-sm text-muted-foreground">{selectedUpload.file_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">File Size</label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedUpload.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Records</label>
                    <p className="text-sm text-muted-foreground">{selectedUpload.total_records}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Successful Records</label>
                    <p className="text-sm text-muted-foreground">{selectedUpload.successful_records}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Failed Records</label>
                    <p className="text-sm text-muted-foreground">{selectedUpload.failed_records}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Success Rate</label>
                    <p className="text-sm text-muted-foreground">{getSuccessRate(selectedUpload)}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Started At</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUpload.started_at)}</p>
                  </div>
                  {selectedUpload.completed_at && (
                    <div>
                      <label className="text-sm font-medium">Completed At</label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedUpload.completed_at)}</p>
                    </div>
                  )}
                </div>

                {selectedUpload.error_details && selectedUpload.error_details.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Error Details</label>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {selectedUpload.error_details.map((error: string, index: number) => (
                          <p key={index} className="text-sm text-red-600">• {error}</p>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
