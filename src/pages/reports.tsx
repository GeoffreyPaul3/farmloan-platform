
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle, Download, FileText, FileSpreadsheet, File, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType } from 'docx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [viewReportData, setViewReportData] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: clubs } = useQuery({
    queryKey: ["clubs-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_groups")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: farmers } = useQuery({
    queryKey: ["farmers-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("*, farmer_groups(name)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Get current user info
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        return profile || { full_name: user.email, email: user.email };
      }
      return null;
    },
  });

  const { data: loans } = useQuery({
    queryKey: ["loans-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, farmers(full_name), farmer_groups(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ["deliveries-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, farmers(full_name), farmer_groups(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: inputDistributions } = useQuery({
    queryKey: ["input-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_distributions")
        .select("*, farmers(full_name), farmer_groups(name), input_items(name, unit_price)");
      if (error) throw error;
      return data;
    },
  });

  const { data: cashPayments } = useQuery({
    queryKey: ["cash-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_payments")
        .select("*, farmers(full_name), farmer_groups(name)");
      if (error) throw error;
      return data;
    },
  });

  // Calculate club performance data
  const clubPerformanceData = clubs?.map(club => {
    const clubFarmers = farmers?.filter(f => f.farmer_group_id === club.id) || [];
    const clubDeliveries = deliveries?.filter(d => d.farmer_group_id === club.id) || [];
    const totalWeight = clubDeliveries.reduce((sum, d) => sum + (d.weight || 0), 0);
    
    return {
      name: club.name.length > 15 ? club.name.substring(0, 15) + '...' : club.name,
      members: clubFarmers.length,
      deliveries: totalWeight,
      creditScore: club.credit_score || 0
    };
  }) || [];

  // Loan status distribution
  const loanStatusData = [
    { name: 'Active', value: loans?.filter(l => l.status === 'approved').length || 0 },
    { name: 'Pending', value: loans?.filter(l => l.status === 'pending').length || 0 },
    { name: 'Rejected', value: loans?.filter(l => l.status === 'rejected').length || 0 },
  ];

  // Monthly delivery trends (mock data for demonstration)
  const deliveryTrendData = [
    { month: 'Jan', weight: 1200, value: 24000 },
    { month: 'Feb', weight: 1800, value: 36000 },
    { month: 'Mar', weight: 2200, value: 44000 },
    { month: 'Apr', weight: 2800, value: 56000 },
    { month: 'May', weight: 3200, value: 64000 },
    { month: 'Jun', weight: 2900, value: 58000 },
  ];

  // Download functions
  const downloadReport = async (format: 'word' | 'excel' | 'pdf', reportType: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_${timestamp}`;
    
    let reportData: any = {};
    
    switch (reportType) {
      case 'membership-register':
        reportData = generateMembershipRegisterData();
        break;
      case 'loan-balances':
        reportData = generateLoanBalancesData();
        break;
      case 'loan-statement':
        reportData = generateLoanStatementData();
        break;
      case 'portfolio-risk':
        reportData = generatePortfolioRiskData();
        break;
      case 'seasonal-recovery':
        reportData = generateSeasonalRecoveryData();
        break;
      case 'input-distribution':
        reportData = generateInputDistributionData();
        break;
      case 'input-summary':
        reportData = generateInputSummaryData();
        break;
      case 'delivery-grading':
        reportData = generateDeliveryGradingData();
        break;
      case 'loan-offset':
        reportData = generateLoanOffsetData();
        break;
      case 'exceptions':
        reportData = generateExceptionsReportData();
        break;
      case 'aging-report':
        reportData = generateAgingReportData();
        break;
      case 'seasonal-summary':
        reportData = generateSeasonalSummaryData();
        break;
    }

    // Add current user info to all reports
    reportData.generatedBy = currentUser?.full_name || 'Current User';

    if (format === 'pdf') {
      generatePDF(reportData, filename);
    } else if (format === 'excel') {
      generateExcel(reportData, filename);
    } else {
      generateWord(reportData, filename);
    }
  };

  // Enhanced PDF Generation with Professional Formatting
  const generatePDF = (data: any, filename: string) => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Add company logo/header
    doc.setFillColor(41, 128, 185); // Professional blue
    doc.rect(0, 0, 220, 30, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FARM LOAN PLATFORM', 20, 15);
    
    // Report title
    doc.setFontSize(14);
    doc.text(data.title, 20, 25);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report metadata
    yPos = 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPos);
    yPos += 8;
    doc.text(`Generated By: ${data.generatedBy || 'Current User'}`, 20, yPos);
    yPos += 8;
    doc.text(`Report Period: ${data.period || 'All Time'}`, 20, yPos);
    yPos += 15;
    
    // Executive Summary
    if (data.summary) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(data.summary, 170);
      summaryLines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 6;
      });
      yPos += 10;
    }
    
    // Key Metrics
    if (data.metrics) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY METRICS', 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      data.metrics.forEach((metric: any) => {
        doc.text(`${metric.label}: ${metric.value}`, 20, yPos);
        yPos += 6;
      });
      yPos += 10;
    }
    
    // Detailed Data Table
    if (data.data && data.data.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILED DATA', 20, yPos);
      yPos += 8;
      
      // Table headers
      const headers = Object.keys(data.data[0]).filter(key => key !== '');
      const colWidths = headers.map(() => 35); // Equal width columns
      
      // Draw table header with better styling
      doc.setFillColor(240, 240, 240);
      let xPos = 20;
      headers.forEach((header, index) => {
        // Draw header background
        doc.rect(xPos, yPos - 5, colWidths[index], 8, 'F');
        // Draw header border
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, yPos - 5, colWidths[index], 8, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(header, xPos + 2, yPos);
        xPos += colWidths[index];
      });
      
      yPos += 8;
      
      // Table data with better formatting
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      data.data.slice(0, 20).forEach((row: any) => { // Limit to first 20 rows for PDF
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        xPos = 20;
        headers.forEach((header, index) => {
          const cellText = String(row[header] || '');
          const lines = doc.splitTextToSize(cellText, colWidths[index] - 4);
          
          // Draw cell border
          doc.setDrawColor(200, 200, 200);
          doc.rect(xPos, yPos - 4, colWidths[index], Math.max(8, lines.length * 4), 'S');
          
          lines.forEach((line: string) => {
            doc.text(line, xPos + 2, yPos);
            yPos += 4;
          });
          xPos += colWidths[index];
          yPos -= lines.length * 4;
        });
        yPos += 8;
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This report was generated automatically by the Farm Loan Platform System.', 20, 280);
    doc.text('For questions or concerns, please contact the system administrator.', 20, 285);
    
    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }
    
    // Save
    doc.save(`${filename}.pdf`);
  };

  // Enhanced Excel Generation with Professional Formatting
  const generateExcel = (data: any, filename: string) => {
    const workbook = XLSX.utils.book_new();
    
    // Add metadata sheet
    const metadata = [
      ['FARM LOAN PLATFORM - REPORT METADATA'],
      [''],
      ['Report Title', data.title],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Generated Time', new Date().toLocaleTimeString()],
      ['Generated By', data.generatedBy || 'System User'],
      ['Report Period', data.period || 'All Time'],
      ['Total Records', data.data ? data.data.length : 0],
      [''],
      ['EXECUTIVE SUMMARY'],
      [data.summary || 'No summary available'],
      [''],
      ['KEY METRICS']
    ];
    
    if (data.metrics) {
      data.metrics.forEach((metric: any) => {
        metadata.push([metric.label, metric.value]);
      });
    }
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Report Info');
    
    // Add main data sheet
    if (data.worksheets) {
      data.worksheets.forEach((worksheet: any) => {
        const ws = XLSX.utils.json_to_sheet(worksheet.data);
        
        // Add formatting
        ws['!cols'] = worksheet.data.length > 0 ? 
          Object.keys(worksheet.data[0]).map(() => ({ width: 15 })) : 
          [{ width: 15 }];
        
        // Add header styling
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: "center" }
            };
          }
        }
        
        XLSX.utils.book_append_sheet(workbook, ws, worksheet.name);
      });
    } else if (data.data) {
      const ws = XLSX.utils.json_to_sheet(data.data);
      
      // Add column formatting
      ws['!cols'] = data.data.length > 0 ? 
        Object.keys(data.data[0]).map(() => ({ width: 15 })) : 
        [{ width: 15 }];
      
      // Add header styling
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, ws, 'Main Data');
    }
    
    // Add summary sheet if metrics exist
    if (data.metrics && data.metrics.length > 0) {
      const summaryData = data.metrics.map((metric: any) => ({
        'Metric': metric.label,
        'Value': metric.value,
        'Description': metric.description || ''
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ width: 20 }, { width: 15 }, { width: 30 }];
      
      // Style summary headers
      const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
      for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (summarySheet[cellAddress]) {
          summarySheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "70AD47" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    // Set workbook properties
    workbook.Props = {
      Title: data.title,
      Subject: 'Farm Loan Platform Report',
      Author: 'Farm Loan Platform System',
      CreatedDate: new Date(),
      Keywords: 'farm, loan, report, audit',
      Category: 'Financial Report'
    };
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Enhanced Word Generation with Professional Formatting
  const generateWord = async (data: any, filename: string) => {
    const children: any[] = [];
    
    // Title page
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'FARM LOAN PLATFORM',
            bold: true,
            size: 36,
            color: '2E86AB',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: data.title,
            bold: true,
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
            size: 20,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated By: ${data.generatedBy || 'System User'}`,
            size: 16,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Report Period: ${data.period || 'All Time'}`,
            size: 16,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '',
          }),
        ],
        pageBreakBefore: true,
      })
    );
    
    // Executive Summary
    if (data.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EXECUTIVE SUMMARY',
              bold: true,
              size: 24,
              color: '2E86AB',
            }),
          ],
          spacing: { after: 200, before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.summary,
              size: 20,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }
    
    // Key Metrics
    if (data.metrics && data.metrics.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'KEY METRICS',
              bold: true,
              size: 24,
              color: '2E86AB',
            }),
          ],
          spacing: { after: 200, before: 200 },
        })
      );
      
      const metricRows = data.metrics.map((metric: any) => 
        new DocxTableRow({
          children: [
            new DocxTableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: metric.label,
                      bold: true,
                      size: 18,
                    }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: metric.value,
                      size: 18,
                    }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
      
      children.push(
        new DocxTable({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: metricRows,
        }),
        new Paragraph({
          children: [new TextRun({ text: '', size: 20 })],
          spacing: { after: 300 },
        })
      );
    }
    
    // Detailed Data Table
    if (data.data && data.data.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'DETAILED DATA',
              bold: true,
              size: 24,
              color: '2E86AB',
            }),
          ],
          spacing: { after: 200, before: 200 },
        })
      );
      
      // Create table headers
      const headers = Object.keys(data.data[0]);
      const headerRow = new DocxTableRow({
        children: headers.map(header => 
          new DocxTableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    size: 16,
                    color: 'FFFFFF',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
            shading: { fill: '4472C4' },
          })
        ),
      });
      
      // Create data rows (limit to first 50 for Word document)
      const dataRows = data.data.slice(0, 50).map((row: any) => 
        new DocxTableRow({
          children: headers.map(header => 
            new DocxTableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: String(row[header] || ''),
                      size: 14,
                    }),
                  ],
                }),
              ],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
            })
          ),
        })
      );
      
      children.push(
        new DocxTable({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        })
      );
    }
    
    // Footer information
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '',
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This report was generated automatically by the Farm Loan Platform System.',
            size: 12,
            color: '666666',
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'For questions or concerns, please contact the system administrator.',
            size: 12,
            color: '666666',
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
  };

  // Enhanced Report generation functions
  const generateMembershipRegisterData = () => {
    const groupedFarmers = farmers?.reduce((acc, farmer) => {
      const groupName = farmer.farmer_groups?.name || 'Unknown Group';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(farmer);
      return acc;
    }, {} as Record<string, any[]>) || {};

    const data = [];
    Object.entries(groupedFarmers).forEach(([groupName, groupFarmers]) => {
      data.push({ 'Club Name': groupName, '': '', '': '', '': '', '': '' });
      groupFarmers.forEach(farmer => {
        data.push({
          'Farmer Name': farmer.full_name,
          'Farm Size (Acres)': farmer.farm_size_acres || 'N/A',
          'GPS Coordinates': `${farmer.gps_lat || 'N/A'}, ${farmer.gps_lng || 'N/A'}`,
          'Status': farmer.status || 'Active',
          'Phone': farmer.phone || 'N/A',
          'Join Date': farmer.join_date || 'N/A'
        });
      });
      data.push({ '': '', '': '', '': '', '': '', '': '' });
    });

    const totalFarmers = farmers?.length || 0;
    const activeFarmers = farmers?.filter(f => f.status === 'active').length || 0;
    const totalGroups = Object.keys(groupedFarmers).length;

    return {
      title: 'Farmer Membership Register',
      summary: `This report provides a comprehensive overview of all registered farmers in the Farm Loan Platform system. The data is organized by farmer groups and includes key demographic and contact information for each member.`,
      metrics: [
        { label: 'Total Farmers', value: totalFarmers, description: 'Total number of registered farmers' },
        { label: 'Active Farmers', value: activeFarmers, description: 'Number of farmers with active status' },
        { label: 'Total Groups', value: totalGroups, description: 'Number of farmer groups/clubs' },
        { label: 'Average Group Size', value: totalGroups > 0 ? Math.round(totalFarmers / totalGroups) : 0, description: 'Average number of farmers per group' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Membership Register',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateLoanBalancesData = () => {
    const data = loans?.map(loan => {
      const farmerName = loan.farmers?.full_name || 'Unknown';
      const groupName = loan.farmer_groups?.name || 'Unknown Group';
      const outstanding = loan.outstanding_balance || 0;
      const total = loan.amount || 0;
      const repaid = total - outstanding;
      
      return {
        'Farmer Name': farmerName,
        'Group': groupName,
        'Opening Balance': `MWK ${total.toFixed(2)}`,
        'Repayments': `MWK ${repaid.toFixed(2)}`,
        'Outstanding': `MWK ${outstanding.toFixed(2)}`,
        'Status': loan.status,
        'Due Date': loan.due_date || 'N/A',
        'Purpose': loan.purpose || 'N/A'
      };
    }) || [];

    const totalOutstanding = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    const totalLoans = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
    const totalRepaid = totalLoans - totalOutstanding;
    const recoveryRate = totalLoans > 0 ? (totalRepaid / totalLoans) * 100 : 0;

    return {
      title: 'Loan Account Balances',
      summary: `This report provides a comprehensive overview of all loan accounts in the system, showing opening balances, repayments made, and outstanding amounts for each farmer.`,
      metrics: [
        { label: 'Total Loans Disbursed', value: `MWK ${totalLoans.toFixed(2)}`, description: 'Total amount of loans issued' },
        { label: 'Total Outstanding', value: `MWK ${totalOutstanding.toFixed(2)}`, description: 'Total amount still owed' },
        { label: 'Total Repayments', value: `MWK ${totalRepaid.toFixed(2)}`, description: 'Total amount repaid' },
        { label: 'Recovery Rate', value: `${recoveryRate.toFixed(1)}%`, description: 'Percentage of loans recovered' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Loan Balances',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateLoanStatementData = () => {
    const data = loans?.map(loan => {
      const farmerName = loan.farmers?.full_name || 'Unknown';
      const groupName = loan.farmer_groups?.name || 'Unknown Group';
      const outstanding = loan.outstanding_balance || 0;
      const total = loan.amount || 0;
      const repaid = total - outstanding;
      
      return {
        'Farmer Name': farmerName,
        'Group': groupName,
        'Loan Amount': `MWK ${total.toFixed(2)}`,
        'Repayments Made': `MWK ${repaid.toFixed(2)}`,
        'Current Balance': `MWK ${outstanding.toFixed(2)}`,
        'Status': loan.status,
        'Due Date': loan.due_date || 'N/A',
        'Purpose': loan.purpose || 'N/A'
      };
    }) || [];

    const totalOutstanding = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    const totalLoans = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
    const totalRepaid = totalLoans - totalOutstanding;

    return {
      title: 'Loan Statement (per Farmer)',
      summary: `This report provides a detailed ledger-style statement for each farmer showing all loan disbursements and repayments made.`,
      metrics: [
        { label: 'Total Loans', value: loans?.length || 0, description: 'Number of active loans' },
        { label: 'Total Disbursed', value: `MWK ${totalLoans.toFixed(2)}`, description: 'Total amount disbursed' },
        { label: 'Total Outstanding', value: `MWK ${totalOutstanding.toFixed(2)}`, description: 'Total amount still owed' },
        { label: 'Total Repaid', value: `MWK ${totalRepaid.toFixed(2)}`, description: 'Total amount repaid' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Loan Statement',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generatePortfolioRiskData = () => {
    const today = new Date();
    const par30 = loans?.filter(loan => {
      const dueDate = new Date(loan.due_date || '');
      const daysOverdue = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOverdue > 30 && daysOverdue <= 60 && loan.status === 'active';
    }) || [];
    
    const par60 = loans?.filter(loan => {
      const dueDate = new Date(loan.due_date || '');
      const daysOverdue = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOverdue > 60 && daysOverdue <= 90 && loan.status === 'active';
    }) || [];
    
    const par90 = loans?.filter(loan => {
      const dueDate = new Date(loan.due_date || '');
      const daysOverdue = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOverdue > 90 && loan.status === 'active';
    }) || [];

    const summaryData = [
      {
        'Risk Category': 'PAR 30 (31-60 days)',
        'Number of Loans': par30.length,
        'Total Amount': `MWK ${par30.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(2)}`
      },
      {
        'Risk Category': 'PAR 60 (61-90 days)',
        'Number of Loans': par60.length,
        'Total Amount': `MWK ${par60.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(2)}`
      },
      {
        'Risk Category': 'PAR 90 (90+ days)',
        'Number of Loans': par90.length,
        'Total Amount': `MWK ${par90.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(2)}`
      }
    ];

    const detailData = [...par30, ...par60, ...par90].map(loan => ({
      'Farmer Name': loan.farmers?.full_name || 'Unknown',
      'Group': loan.farmer_groups?.name || 'Unknown',
      'Outstanding Amount': `MWK ${(loan.outstanding_balance || 0).toFixed(2)}`,
      'Due Date': loan.due_date || 'N/A',
      'Days Overdue': Math.floor((today.getTime() - new Date(loan.due_date || '').getTime()) / (1000 * 60 * 60 * 24))
    }));

    const totalRiskyLoans = par30.length + par60.length + par90.length;
    const totalRiskyAmount = par30.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) + 
                            par60.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) + 
                            par90.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);

    return {
      title: 'Portfolio at Risk (PAR) Report',
      summary: `This report identifies loans that are overdue and categorizes them by risk level (PAR 30, 60, and 90+ days).`,
      metrics: [
        { label: 'Total Risky Loans', value: totalRiskyLoans, description: 'Number of overdue loans' },
        { label: 'Total Risky Amount', value: `MWK ${totalRiskyAmount.toFixed(2)}`, description: 'Total outstanding amount at risk' },
        { label: 'PAR 30 Loans', value: par30.length, description: 'Loans 31-60 days overdue' },
        { label: 'PAR 60+ Loans', value: par60.length + par90.length, description: 'Loans 61+ days overdue' }
      ],
      data: summaryData,
      worksheets: [
        {
          name: 'PAR Summary',
          data: summaryData
        },
        {
          name: 'PAR Details',
          data: detailData
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateSeasonalRecoveryData = () => {
    const totalLoans = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
    const outstandingLoans = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    const recoveredLoans = totalLoans - outstandingLoans;
    const recoveryRate = totalLoans > 0 ? (recoveredLoans / totalLoans) * 100 : 0;

    const data = [
      {
        'Season': new Date().getFullYear().toString(),
        'Total Loans Disbursed': `MWK ${totalLoans.toFixed(2)}`,
        'Total Repayments': `MWK ${recoveredLoans.toFixed(2)}`,
        'Outstanding Balance': `MWK ${outstandingLoans.toFixed(2)}`,
        'Recovery Rate': `${recoveryRate.toFixed(1)}%`
      }
    ];

    return {
      title: 'Seasonal Recovery Report',
      summary: `This report provides a comprehensive overview of loan recovery performance for the current season.`,
      metrics: [
        { label: 'Total Loans Disbursed', value: `MWK ${totalLoans.toFixed(2)}`, description: 'Total amount disbursed this season' },
        { label: 'Total Repayments', value: `MWK ${recoveredLoans.toFixed(2)}`, description: 'Total amount recovered' },
        { label: 'Outstanding Balance', value: `MWK ${outstandingLoans.toFixed(2)}`, description: 'Amount still outstanding' },
        { label: 'Recovery Rate', value: `${recoveryRate.toFixed(1)}%`, description: 'Percentage of loans recovered' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Seasonal Recovery',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: `${new Date().getFullYear()} Season`
    };
  };

  const generateInputDistributionData = () => {
    const data = inputDistributions?.map(input => {
      const farmerName = input.farmers?.full_name || 'Unknown';
      const groupName = input.farmer_groups?.name || 'Unknown';
      const itemName = input.input_items?.name || 'Unknown Item';
      const quantity = input.quantity || 0;
      const unitPrice = input.input_items?.unit_price || 0;
      const value = quantity * unitPrice;
      
      return {
        'Farmer Name': farmerName,
        'Group': groupName,
        'Item': itemName,
        'Quantity': quantity,
        'Unit Price': `MWK ${unitPrice.toFixed(2)}`,
        'Total Value': `MWK ${value.toFixed(2)}`,
        'Distribution Date': input.distribution_date || 'N/A',
        'Acknowledged': input.acknowledgement_received ? 'Yes' : 'No'
      };
    }) || [];

    const totalValue = inputDistributions?.reduce((sum, input) => {
      const quantity = input.quantity || 0;
      const unitPrice = input.input_items?.unit_price || 0;
      return sum + (quantity * unitPrice);
    }, 0) || 0;

    return {
      title: 'Input Distribution Report',
      content: `Total Distributions: ${inputDistributions?.length || 0}\nTotal Value: MWK ${totalValue.toFixed(2)}`,
      data: data,
      worksheets: [
        {
          name: 'Input Distribution',
          data: data
        }
      ]
    };
  };

  const generateInputSummaryData = () => {
    const itemSummary = inputDistributions?.reduce((acc, input) => {
      const itemName = input.input_items?.name || 'Unknown Item';
      const quantity = input.quantity || 0;
      const unitPrice = input.input_items?.unit_price || 0;
      const value = quantity * unitPrice;
      
      if (!acc[itemName]) {
        acc[itemName] = { quantity: 0, value: 0 };
      }
      acc[itemName].quantity += quantity;
      acc[itemName].value += value;
      return acc;
    }, {} as Record<string, { quantity: number; value: number }>) || {};

    const data = Object.entries(itemSummary).map(([itemName, summary]) => ({
      'Item': itemName,
      'Total Quantity': summary.quantity,
      'Total Value': `MWK ${summary.value.toFixed(2)}`,
      'Average Unit Price': `MWK ${(summary.value / summary.quantity).toFixed(2)}`
    }));

    const totalValue = Object.values(itemSummary).reduce((sum, summary) => sum + summary.value, 0);

    return {
      title: 'Input Summary by Item',
      summary: `This report provides a summary of all input items distributed, showing total quantities and values by item type.`,
      metrics: [
        { label: 'Total Items', value: Object.keys(itemSummary).length, description: 'Number of different input types' },
        { label: 'Total Value', value: `MWK ${totalValue.toFixed(2)}`, description: 'Total value of all inputs distributed' },
        { label: 'Total Quantity', value: Object.values(itemSummary).reduce((sum, summary) => sum + summary.quantity, 0), description: 'Total quantity of all inputs' },
        { label: 'Average Item Value', value: `MWK ${(totalValue / Object.keys(itemSummary).length).toFixed(2)}`, description: 'Average value per item type' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Input Summary',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateDeliveryGradingData = () => {
    const data = deliveries?.map(delivery => {
      const farmerName = delivery.farmers?.full_name || 'Unknown';
      const groupName = delivery.farmer_groups?.name || 'Unknown';
      const weight = delivery.weight || 0;
      const grade = delivery.grade || 'N/A';
      const value = delivery.gross_amount || 0;
      const pricePerKg = delivery.price_per_kg || 0;
      
      return {
        'Farmer Name': farmerName,
        'Group': groupName,
        'Weight (kg)': weight,
        'Grade': grade,
        'Price per kg': `MWK ${pricePerKg.toFixed(2)}`,
        'Total Value': `MWK ${value.toFixed(2)}`,
        'Delivery Date': delivery.delivery_date || 'N/A',
        'Receipt ID': delivery.id
      };
    }) || [];

    const totalWeight = deliveries?.reduce((sum, d) => sum + (d.weight || 0), 0) || 0;
    const totalValue = deliveries?.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;

    return {
      title: 'Delivery & Grading Report',
      summary: `This report provides detailed information about cotton deliveries, including weights, grades, and values for each farmer.`,
      metrics: [
        { label: 'Total Deliveries', value: deliveries?.length || 0, description: 'Number of delivery transactions' },
        { label: 'Total Weight', value: `${totalWeight.toFixed(2)} kg`, description: 'Total cotton weight delivered' },
        { label: 'Total Value', value: `MWK ${totalValue.toFixed(2)}`, description: 'Total value of all deliveries' },
        { label: 'Average Price/kg', value: `MWK ${totalWeight > 0 ? (totalValue / totalWeight).toFixed(2) : 0}`, description: 'Average price per kilogram' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Delivery & Grading',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateLoanOffsetData = () => {
    const data = deliveries?.map(delivery => {
      const farmerName = delivery.farmers?.full_name || 'Unknown';
      const groupName = delivery.farmer_groups?.name || 'Unknown';
      const deliveryValue = delivery.gross_amount || 0;
      const loanOffset = delivery.loan_offset || 0;
      const netProceeds = deliveryValue - loanOffset;
      const offsetPercentage = deliveryValue > 0 ? (loanOffset / deliveryValue) * 100 : 0;
      
      return {
        'Farmer Name': farmerName,
        'Group': groupName,
        'Delivery Value': `MWK ${deliveryValue.toFixed(2)}`,
        'Loan Offset': `MWK ${loanOffset.toFixed(2)}`,
        'Offset %': `${offsetPercentage.toFixed(1)}%`,
        'Net Proceeds': `MWK ${netProceeds.toFixed(2)}`,
        'Delivery Date': delivery.delivery_date || 'N/A'
      };
    }) || [];

    const totalDeliveryValue = deliveries?.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;
    const totalLoanOffset = deliveries?.reduce((sum, d) => sum + (d.loan_offset || 0), 0) || 0;

    const totalNetProceeds = totalDeliveryValue - totalLoanOffset;
    const averageOffsetPercentage = totalDeliveryValue > 0 ? (totalLoanOffset / totalDeliveryValue) * 100 : 0;

    return {
      title: 'Loan Offset from Deliveries',
      summary: `This report shows how cotton delivery proceeds are used to offset outstanding loans, providing transparency in the loan recovery process.`,
      metrics: [
        { label: 'Total Delivery Value', value: `MWK ${totalDeliveryValue.toFixed(2)}`, description: 'Total value of all deliveries' },
        { label: 'Total Loan Offset', value: `MWK ${totalLoanOffset.toFixed(2)}`, description: 'Total amount used for loan repayment' },
        { label: 'Net Proceeds', value: `MWK ${totalNetProceeds.toFixed(2)}`, description: 'Amount remaining after loan offset' },
        { label: 'Average Offset %', value: `${averageOffsetPercentage.toFixed(1)}%`, description: 'Average percentage of delivery value used for loans' }
      ],
      data: data,
      worksheets: [
        {
          name: 'Loan Offset',
          data: data
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateExceptionsReportData = () => {
    // Farmers who received inputs but delivered no cotton
    const farmersWithInputs = inputDistributions?.map(input => input.farmer_id) || [];
    const farmersWithDeliveries = deliveries?.map(delivery => delivery.farmer_id) || [];
    const farmersWithInputsNoDeliveries = farmersWithInputs.filter(id => !farmersWithDeliveries.includes(id));
    
    const noDeliveriesData = farmersWithInputsNoDeliveries.map(farmerId => {
      const farmer = farmers?.find(f => f.id === farmerId);
      return {
        'Farmer Name': farmer?.full_name || 'Unknown',
        'Group': farmer?.farmer_groups?.name || 'Unknown',
        'Phone': farmer?.phone || 'N/A',
        'Exception Type': 'Inputs but No Deliveries'
      };
    });

    const noRepaymentsData = loans?.filter(loan => loan.outstanding_balance === loan.amount).map(loan => ({
      'Farmer Name': loan.farmers?.full_name || 'Unknown',
      'Group': loan.farmer_groups?.name || 'Unknown',
      'Loan Amount': `MWK ${(loan.amount || 0).toFixed(2)}`,
      'Outstanding': `MWK ${(loan.outstanding_balance || 0).toFixed(2)}`,
      'Exception Type': 'Loan without Repayments'
    })) || [];

    const allExceptions = [...noDeliveriesData, ...noRepaymentsData];

    return {
      title: 'Exceptions Report',
      summary: `This report identifies farmers with exceptions such as receiving inputs but not making deliveries, or having loans without any repayments.`,
      metrics: [
        { label: 'Total Exceptions', value: allExceptions.length, description: 'Total number of exceptions found' },
        { label: 'No Deliveries', value: noDeliveriesData.length, description: 'Farmers with inputs but no deliveries' },
        { label: 'No Repayments', value: noRepaymentsData.length, description: 'Farmers with loans but no repayments' },
        { label: 'Exception Rate', value: `${farmers?.length ? ((allExceptions.length / farmers.length) * 100).toFixed(1) : 0}%`, description: 'Percentage of farmers with exceptions' }
      ],
      data: allExceptions,
      worksheets: [
        {
          name: 'All Exceptions',
          data: allExceptions
        },
        {
          name: 'No Deliveries',
          data: noDeliveriesData
        },
        {
          name: 'No Repayments',
          data: noRepaymentsData
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateAgingReportData = () => {
    const today = new Date();
    const agingBuckets = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': []
    };
    
    loans?.forEach(loan => {
      if (loan.status === 'active' && loan.due_date) {
        const dueDate = new Date(loan.due_date);
        const daysOverdue = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysOverdue <= 30) agingBuckets['0-30'].push(loan);
        else if (daysOverdue <= 60) agingBuckets['31-60'].push(loan);
        else if (daysOverdue <= 90) agingBuckets['61-90'].push(loan);
        else agingBuckets['90+'].push(loan);
      }
    });

    const summaryData = Object.entries(agingBuckets).map(([bucket, loans]) => ({
      'Aging Bucket': `${bucket} days`,
      'Number of Loans': loans.length,
      'Total Outstanding': `MWK ${loans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(2)}`,
      'Percentage': `${loans.length > 0 ? ((loans.length / (loans?.length || 1)) * 100).toFixed(1) : 0}%`
    }));

    const detailData = Object.entries(agingBuckets).flatMap(([bucket, loans]) => 
      loans.map(loan => ({
        'Farmer Name': loan.farmers?.full_name || 'Unknown',
        'Group': loan.farmer_groups?.name || 'Unknown',
        'Aging Bucket': `${bucket} days`,
        'Outstanding Amount': `MWK ${(loan.outstanding_balance || 0).toFixed(2)}`,
        'Due Date': loan.due_date || 'N/A',
        'Days Overdue': Math.floor((today.getTime() - new Date(loan.due_date || '').getTime()) / (1000 * 60 * 60 * 24))
      }))
    );

    const totalActiveLoans = loans?.filter(l => l.status === 'active').length || 0;
    const totalOutstandingAmount = Object.values(agingBuckets).flat().reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);

    return {
      title: 'Aging Report',
      summary: `This report categorizes outstanding loans by their aging buckets to help identify loans that require immediate attention.`,
      metrics: [
        { label: 'Total Active Loans', value: totalActiveLoans, description: 'Number of active loans in the system' },
        { label: 'Total Outstanding', value: `MWK ${totalOutstandingAmount.toFixed(2)}`, description: 'Total outstanding amount across all loans' },
        { label: 'Overdue Loans', value: Object.values(agingBuckets).slice(1).flat().length, description: 'Number of loans past due date' },
        { label: 'Current Loans', value: agingBuckets['0-30'].length, description: 'Number of loans within 30 days of due date' }
      ],
      data: summaryData,
      worksheets: [
        {
          name: 'Aging Summary',
          data: summaryData
        },
        {
          name: 'Aging Details',
          data: detailData
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: 'All Time'
    };
  };

  const generateSeasonalSummaryData = () => {
    const totalMembers = farmers?.length || 0;
    const totalInputsValue = inputDistributions?.reduce((sum, input) => {
      const quantity = input.quantity || 0;
      const unitPrice = input.input_items?.unit_price || 0;
      return sum + (quantity * unitPrice);
    }, 0) || 0;
    const totalDeliveries = deliveries?.reduce((sum, d) => sum + (d.weight || 0), 0) || 0;
    const totalDeliveriesValue = deliveries?.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;
    const totalLoans = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
    const outstandingLoans = loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0) || 0;
    const recoveredLoans = totalLoans - outstandingLoans;
    const recoveryRate = totalLoans > 0 ? (recoveredLoans / totalLoans) * 100 : 0;

    const summaryData = [
      {
        'Metric': 'Members Enrolled',
        'Value': totalMembers,
        'Unit': 'Farmers'
      },
      {
        'Metric': 'Total Inputs Issued',
        'Value': `MWK ${totalInputsValue.toFixed(2)}`,
        'Unit': 'Currency'
      },
      {
        'Metric': 'Total Cotton Delivered',
        'Value': `${totalDeliveries.toFixed(2)} kg`,
        'Unit': 'Weight'
      },
      {
        'Metric': 'Total Delivery Value',
        'Value': `MWK ${totalDeliveriesValue.toFixed(2)}`,
        'Unit': 'Currency'
      },
      {
        'Metric': 'Total Loans Disbursed',
        'Value': `MWK ${totalLoans.toFixed(2)}`,
        'Unit': 'Currency'
      },
      {
        'Metric': 'Loans Recovered',
        'Value': `MWK ${recoveredLoans.toFixed(2)}`,
        'Unit': 'Currency'
      },
      {
        'Metric': 'Loans Outstanding',
        'Value': `MWK ${outstandingLoans.toFixed(2)}`,
        'Unit': 'Currency'
      },
      {
        'Metric': 'Recovery Rate',
        'Value': `${recoveryRate.toFixed(1)}%`,
        'Unit': 'Percentage'
      }
    ];

    return {
      title: 'Seasonal Summary Dashboard',
      summary: `This comprehensive dashboard provides an overview of all key performance indicators for the current season, including membership, inputs, deliveries, and loan performance.`,
      metrics: [
        { label: 'Members Enrolled', value: totalMembers, description: 'Total number of registered farmers' },
        { label: 'Total Inputs Value', value: `MWK ${totalInputsValue.toFixed(2)}`, description: 'Total value of inputs distributed' },
        { label: 'Total Deliveries', value: `${totalDeliveries.toFixed(2)} kg`, description: 'Total cotton weight delivered' },
        { label: 'Recovery Rate', value: `${recoveryRate.toFixed(1)}%`, description: 'Percentage of loans recovered' }
      ],
      data: summaryData,
      worksheets: [
        {
          name: 'Seasonal Summary',
          data: summaryData
        }
      ],
      generatedBy: currentUser?.full_name || 'Current User',
      period: `${new Date().getFullYear()} Season`
    };
  };

  const viewReport = (reportType: string) => {
    let reportData: any = {};
    switch (reportType) {
      case 'membership-register':
        reportData = generateMembershipRegisterData();
        break;
      case 'loan-balances':
        reportData = generateLoanBalancesData();
        break;
      case 'loan-statement':
        reportData = generateLoanStatementData();
        break;
      case 'portfolio-risk':
        reportData = generatePortfolioRiskData();
        break;
      case 'seasonal-recovery':
        reportData = generateSeasonalRecoveryData();
        break;
      case 'input-distribution':
        reportData = generateInputDistributionData();
        break;
      case 'input-summary':
        reportData = generateInputSummaryData();
        break;
      case 'delivery-grading':
        reportData = generateDeliveryGradingData();
        break;
      case 'loan-offset':
        reportData = generateLoanOffsetData();
        break;
      case 'exceptions':
        reportData = generateExceptionsReportData();
        break;
      case 'aging-report':
        reportData = generateAgingReportData();
        break;
      case 'seasonal-summary':
        reportData = generateSeasonalSummaryData();
        break;
    }
    setViewReportData(reportData);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{clubs?.filter(c => c.status === 'active').length || 0}</div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{farmers?.length || 0}</div>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  MWK {loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(0) || 0}
                </div>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {deliveries?.reduce((sum, d) => sum + (d.weight || 0), 0).toFixed(0) || 0} kg
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

                 <Tabs defaultValue="performance">
           <TabsList>
             <TabsTrigger value="performance">Club Performance</TabsTrigger>
             <TabsTrigger value="loans">Loan Analysis</TabsTrigger>
             <TabsTrigger value="deliveries">Delivery Trends</TabsTrigger>
             <TabsTrigger value="reports">Reports</TabsTrigger>
           </TabsList>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Club Performance Metrics</CardTitle>
                <CardDescription>Member count, deliveries, and credit scores by club</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={clubPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="members" fill="#8884d8" name="Members" />
                    <Bar dataKey="deliveries" fill="#82ca9d" name="Deliveries (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Status Distribution</CardTitle>
                  <CardDescription>Current status of all loans in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={loanStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {loanStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loan Recovery Analysis</CardTitle>
                  <CardDescription>Key metrics for loan performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Loans Disbursed</span>
                    <span className="font-semibold">
                      MWK {loans?.reduce((sum, l) => sum + (l.amount || 0), 0).toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                    <span className="font-semibold text-orange-600">
                      MWK {loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recovery Rate</span>
                    <span className="font-semibold text-green-600">
                      {loans?.length ? 
                        (((loans.reduce((sum, l) => sum + (l.amount || 0), 0) - 
                           loans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0)) / 
                          loans.reduce((sum, l) => sum + (l.amount || 0), 0)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Trends</CardTitle>
                <CardDescription>Cotton delivery volumes and values over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={deliveryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Value (MWK)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">System Reports</h2>
                <p className="text-muted-foreground">Comprehensive reports available for download in multiple formats</p>
              </div>

              <Tabs defaultValue="farmer-reports" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="farmer-reports">Farmer & Membership</TabsTrigger>
                  <TabsTrigger value="loan-reports">Loan & Repayment</TabsTrigger>
                  <TabsTrigger value="input-reports">Input & Delivery</TabsTrigger>
                  <TabsTrigger value="management-reports">Management & Control</TabsTrigger>
                </TabsList>

            {/* Farmer & Membership Reports */}
            <TabsContent value="farmer-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Farmer & Membership Reports</CardTitle>
                  <CardDescription>Comprehensive farmer and membership data reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Membership Register</h3>
                      <p className="text-sm text-muted-foreground">Full list of farmers grouped by association/district</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('membership-register')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'membership-register')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'membership-register')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'membership-register')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loan & Repayment Reports */}
            <TabsContent value="loan-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan & Repayment Reports</CardTitle>
                  <CardDescription>Comprehensive loan and repayment analysis reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Loan Account Balances</h3>
                      <p className="text-sm text-muted-foreground">Opening balance, inputs issued, repayments, outstanding balance</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('loan-balances')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'loan-balances')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'loan-balances')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'loan-balances')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Loan Statement (per Farmer)</h3>
                      <p className="text-sm text-muted-foreground">Ledger-style showing all disbursements and repayments</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('loan-statement')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'loan-statement')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'loan-statement')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'loan-statement')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Portfolio at Risk (PAR)</h3>
                      <p className="text-sm text-muted-foreground">Overdue loans showing number of farmers and amounts</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('portfolio-risk')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'portfolio-risk')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'portfolio-risk')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'portfolio-risk')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Seasonal Recovery Report</h3>
                      <p className="text-sm text-muted-foreground">Total loans vs repayments recovered per season</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('seasonal-recovery')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'seasonal-recovery')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'seasonal-recovery')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'seasonal-recovery')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Input & Delivery Reports */}
            <TabsContent value="input-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input & Delivery Reports</CardTitle>
                  <CardDescription>Input distribution and delivery analysis reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Input Distribution Report</h3>
                      <p className="text-sm text-muted-foreground">Items disbursed, quantities, and values by farmer/group/season</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('input-distribution')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'input-distribution')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'input-distribution')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'input-distribution')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Input Summary by Item</h3>
                      <p className="text-sm text-muted-foreground">Total issued per season, aggregated at company level</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('input-summary')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'input-summary')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'input-summary')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'input-summary')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Delivery & Grading Report</h3>
                      <p className="text-sm text-muted-foreground">Cotton delivered per farmer with grade, weight, value</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('delivery-grading')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'delivery-grading')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'delivery-grading')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'delivery-grading')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Loan Offset from Deliveries</h3>
                      <p className="text-sm text-muted-foreground">Value of cotton delivered vs loan repayment vs net proceeds</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('loan-offset')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'loan-offset')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'loan-offset')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'loan-offset')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management & Control Reports */}
            <TabsContent value="management-reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Management & Control Reports</CardTitle>
                  <CardDescription>Management oversight and control reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Exceptions Report</h3>
                      <p className="text-sm text-muted-foreground">Farmers with inputs but no deliveries, loans without repayments</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('exceptions')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'exceptions')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'exceptions')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'exceptions')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Aging Report</h3>
                      <p className="text-sm text-muted-foreground">Balances outstanding bucketed by days overdue</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('aging-report')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'aging-report')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'aging-report')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'aging-report')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Seasonal Summary Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Comprehensive seasonal performance overview</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewReport('seasonal-summary')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('word', 'seasonal-summary')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('excel', 'seasonal-summary')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport('pdf', 'seasonal-summary')}>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </TabsContent>
        </Tabs>
      </div>

      {/* Report View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewReportData?.title || 'Report View'}</DialogTitle>
            <DialogDescription>
              {viewReportData?.summary || 'Report data preview'}
            </DialogDescription>
          </DialogHeader>
          
          {viewReportData && (
            <div className="space-y-6">
              {/* Executive Summary */}
              {viewReportData.summary && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Executive Summary</h3>
                  <p className="text-sm text-muted-foreground">{viewReportData.summary}</p>
                </div>
              )}

              {/* Key Metrics */}
              {viewReportData.metrics && viewReportData.metrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {viewReportData.metrics.map((metric: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm text-muted-foreground">{metric.label}</h4>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      {metric.description && (
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Report Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Generated By:</span> {viewReportData.generatedBy || 'System User'}
                </div>
                <div>
                  <span className="font-medium">Report Period:</span> {viewReportData.period || 'All Time'}
                </div>
                <div>
                  <span className="font-medium">Generated:</span> {new Date().toLocaleString()}
                </div>
              </div>

              {/* Detailed Data Table */}
              {viewReportData.data && viewReportData.data.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Detailed Data</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(viewReportData.data[0]).map((header) => (
                              <TableHead key={header} className="whitespace-nowrap">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewReportData.data.slice(0, 50).map((row: any, index: number) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, cellIndex: number) => (
                                <TableCell key={cellIndex} className="whitespace-nowrap">
                                  {String(value || '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {viewReportData.data.length > 50 && (
                      <div className="p-4 bg-muted text-center text-sm text-muted-foreground">
                        Showing first 50 records of {viewReportData.data.length} total records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multiple Worksheets */}
              {viewReportData.worksheets && viewReportData.worksheets.length > 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Additional Worksheets</h3>
                  <div className="space-y-2">
                    {viewReportData.worksheets.slice(1).map((worksheet: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">{worksheet.name}</h4>
                        <div className="max-h-48 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {worksheet.data.length > 0 && Object.keys(worksheet.data[0]).map((header) => (
                                  <TableHead key={header} className="whitespace-nowrap">
                                    {header}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {worksheet.data.slice(0, 20).map((row: any, rowIndex: number) => (
                                <TableRow key={rowIndex}>
                                  {Object.values(row).map((value: any, cellIndex: number) => (
                                    <TableCell key={cellIndex} className="whitespace-nowrap">
                                      {String(value || '')}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {worksheet.data.length > 20 && (
                          <div className="text-center text-xs text-muted-foreground mt-2">
                            Showing first 20 records of {worksheet.data.length} total records
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}