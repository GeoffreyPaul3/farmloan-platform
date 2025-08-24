
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle, Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType } from 'docx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string>("");

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
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: loans } = useQuery({
    queryKey: ["loans-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*");
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

    if (format === 'pdf') {
      generatePDF(reportData, filename);
    } else if (format === 'excel') {
      generateExcel(reportData, filename);
    } else {
      generateWord(reportData, filename);
    }
  };

  // PDF Generation
  const generatePDF = (data: any, filename: string) => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Title
    doc.setFontSize(16);
    doc.text(data.title, 20, yPos);
    yPos += 10;
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 15;
    
    // Content
    doc.setFontSize(12);
    if (data.content) {
      const lines = doc.splitTextToSize(data.content, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
    }
    
    // Save
    doc.save(`${filename}.pdf`);
  };

  // Excel Generation
  const generateExcel = (data: any, filename: string) => {
    const workbook = XLSX.utils.book_new();
    
    if (data.worksheets) {
      data.worksheets.forEach((worksheet: any) => {
        const ws = XLSX.utils.json_to_sheet(worksheet.data);
        XLSX.utils.book_append_sheet(workbook, ws, worksheet.name);
      });
    } else if (data.data) {
      const ws = XLSX.utils.json_to_sheet(data.data);
      XLSX.utils.book_append_sheet(workbook, ws, 'Report');
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Word Generation
  const generateWord = async (data: any, filename: string) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: data.title,
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()}`,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.content || '',
                size: 24,
              }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
  };

  // Report generation functions
  const generateMembershipRegisterData = () => {
    const groupedFarmers = farmers?.reduce((acc, farmer) => {
      const groupName = farmer.farmer_groups?.name || 'Unknown Group';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(farmer);
      return acc;
    }, {} as Record<string, any[]>) || {};

    const data = [];
    Object.entries(groupedFarmers).forEach(([groupName, groupFarmers]) => {
      data.push({ Group: groupName, '': '' });
      groupFarmers.forEach(farmer => {
        data.push({
          'Farmer Name': farmer.full_name,
          'Farm Size': farmer.farm_size || 'N/A',
          'GPS Coordinates': farmer.gps_coordinates || 'N/A',
          'Status': farmer.status || 'Active',
          'Phone': farmer.phone || 'N/A',
          'Location': farmer.farmer_groups?.location || 'N/A'
        });
      });
      data.push({ '': '', '': '', '': '', '': '', '': '' });
    });

    return {
      title: 'Farmer Membership Register',
      content: `Total Farmers: ${farmers?.length || 0}\nTotal Groups: ${Object.keys(groupedFarmers).length}`,
      data: data,
      worksheets: [
        {
          name: 'Membership Register',
          data: data
        }
      ]
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

    return {
      title: 'Loan Account Balances',
      content: `Total Loans: MWK ${totalLoans.toFixed(2)}\nTotal Outstanding: MWK ${totalOutstanding.toFixed(2)}`,
      data: data,
      worksheets: [
        {
          name: 'Loan Balances',
          data: data
        }
      ]
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

    return {
      title: 'Loan Statement (per Farmer)',
      content: `Total Loans: ${loans?.length || 0}\nTotal Outstanding: MWK ${loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(2) || 0}`,
      data: data,
      worksheets: [
        {
          name: 'Loan Statement',
          data: data
        }
      ]
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

    return {
      title: 'Portfolio at Risk (PAR) Report',
      content: `Total Risky Loans: ${par30.length + par60.length + par90.length}`,
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
      ]
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
      content: `Total Loans: MWK ${totalLoans.toFixed(2)}\nRecovery Rate: ${recoveryRate.toFixed(1)}%`,
      data: data,
      worksheets: [
        {
          name: 'Seasonal Recovery',
          data: data
        }
      ]
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
      content: `Total Items: ${Object.keys(itemSummary).length}\nTotal Value: MWK ${totalValue.toFixed(2)}`,
      data: data,
      worksheets: [
        {
          name: 'Input Summary',
          data: data
        }
      ]
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
      content: `Total Deliveries: ${deliveries?.length || 0}\nTotal Weight: ${totalWeight.toFixed(2)} kg\nTotal Value: MWK ${totalValue.toFixed(2)}`,
      data: data,
      worksheets: [
        {
          name: 'Delivery & Grading',
          data: data
        }
      ]
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

    return {
      title: 'Loan Offset from Deliveries',
      content: `Total Delivery Value: MWK ${totalDeliveryValue.toFixed(2)}\nTotal Loan Offset: MWK ${totalLoanOffset.toFixed(2)}`,
      data: data,
      worksheets: [
        {
          name: 'Loan Offset',
          data: data
        }
      ]
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
      content: `Total Exceptions: ${allExceptions.length}\nNo Deliveries: ${noDeliveriesData.length}\nNo Repayments: ${noRepaymentsData.length}`,
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
      ]
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

    return {
      title: 'Aging Report',
      content: `Total Active Loans: ${loans?.filter(l => l.status === 'active').length || 0}`,
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
      ]
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
      content: `Season: ${new Date().getFullYear()}\nGenerated: ${new Date().toLocaleString()}`,
      data: summaryData,
      worksheets: [
        {
          name: 'Seasonal Summary',
          data: summaryData
        }
      ]
    };
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
    </DashboardLayout>
  );
}