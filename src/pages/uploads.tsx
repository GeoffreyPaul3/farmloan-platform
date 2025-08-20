
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Users, TrendingUp } from "lucide-react";

export default function Uploads() {
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
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Farmers CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contracts
              </CardTitle>
              <CardDescription>Upload club contracts and agreements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload PDF contracts and legal documents for farmer clubs. These will be parsed for key information.
                </p>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contracts
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Loan Records
              </CardTitle>
              <CardDescription>Import historical loan data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload CSV files with historical loan information, repayment records, and outstanding balances.
                </p>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Loan Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Validation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All uploads are validated before import</li>
                  <li>• Preview screen shows potential issues</li>
                  <li>• Duplicate records are flagged</li>
                  <li>• Invalid data is highlighted for correction</li>
                  <li>• Rollback available if needed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
