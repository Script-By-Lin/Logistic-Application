'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  DistributionRecord,
  PipeType,
  ProductionRecord,
  ReturnRecord,
  VillageFundingRecord,
  Car,
  CarExpense,
  CarIncome,
} from '@/types';
import SearchableSelect from './SearchableSelect';
import * as XLSX from 'xlsx';

// Dynamic sidebar tabs depending on user role
const ADMIN_TABS = ['Overview', 'Production', 'Distribution', 'Returns', 'Ferry Cars', 'Reconciliation', 'Reports', 'Finance', 'Catalog Settings', 'Audit Logs', 'Backup & Recovery'] as const;
const VIEWER_TABS = ['Overview', 'Distribution', 'Returns', 'Ferry Cars', 'Reconciliation', 'Finance', 'Reports'] as const;

interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  details: string | null;
  timestamp: string;
}

interface Village {
  id: number;
  name: string;
}

// --- Professional Language Translation Matrix ---
const TRANSLATIONS = {
  en: {
    overview: 'Overview',
    production: 'Production',
    distribution: 'Distribution',
    returns: 'Returns',
    catalogSettings: 'Catalog Settings',
    auditLogs: 'Audit Logs',
    role: 'Role',
    welcome: 'Welcome back',
    systemLocked: 'System Locked',
    signOut: 'Sign Out',
    totalStock: 'Total Stock',
    activeModels: 'Active Models',
    distributedUnits: 'Distributed Units',
    returnedStock: 'Returned Stock',
    weeklyDeliveryVelocity: 'Weekly Delivery Velocity',
    last7Days: 'Last 7 days activity',
    realTimeSystemAlerts: 'Real-Time System Alerts',
    activeNotifications: 'Active Notifications',
    liveMetrics: 'Live Metrics',
    outpostsServed: 'Village Outposts Served',
    totalDbRecords: 'Total DB Records',
    systemStatusOptimal: 'System status optimal. No active stock warnings detected.',
    recordCentralProduction: 'Record Central Factory Production',
    logNewProductionOutputs: 'Log new production outputs. Admin security approval is required.',
    productionDate: 'Production Date',
    selectPipeModel: 'Select Pipe Model',
    quantityProducedUnits: 'Quantity Produced (Units)',
    productionBatchId: 'Production Batch ID',
    saveProductionBatch: 'Save Production Batch',
    viewOnlyModeProduction: 'View-only Mode: Production inserts are restricted to administrator role.',
    batchQualityControlRegistry: 'Batch Quality Control Registry',
    searchBatchId: 'Search Batch ID...',
    defectReturns: 'QC Warning: Defect returns',
    passedQcInspection: 'Passed QC inspection',
    noBatchesRegistered: 'No production batches registered.',
    recordDistributionDelivery: 'Record Distribution Delivery',
    outpost: 'Outpost',
    pipeModel: 'Pipe Model',
    startDate: 'From Date',
    endDate: 'To Date',
    classification: 'Classification',
    allVillages: 'All villages',
    allPipeModels: 'All pipe models',
    allStatuses: 'All statuses',
    deliveryDate: 'Delivery Date',
    destinationOutpost: 'Destination Outpost',
    selectStockPipeModel: 'Select Stock Pipe Model',
    quantityToDeliver: 'Quantity to Deliver',
    maximumFactoryAvailable: 'Maximum factory available',
    autoCalculatedUnitPrice: 'Distribution Unit Price (MMK)',
    originPoint: 'Origin Point',
    destinationStorage: 'Destination Storage',
    deliveryMemoRemarks: 'Delivery Memo / Remarks',
    authorizeDistribution: 'Authorize Distribution',
    viewOnlyModeAuthorizations: 'View-only Mode: Authorizations are restricted to administrators.',
    filteredDistributionLogs: 'Filtered Distribution Logs',
    listOfAllOutgoingOutpostDeliveries: ' outgoing outpost deliveries.',
    noDistributionRecords: 'No distribution records match your current filters.',
    processOutpostReturns: 'Process Outpost Returns',
    returnDate: 'Return Date',
    returningOutpost: 'Returning Outpost',
    returnModelType: 'Return Model Type',
    quantityToReturn: 'Quantity to Return',
    villageBalanceCurrentlyDeployed: 'Village balance currently deployed',
    inventoryClassification: 'Inventory Classification',
    damagedScrapped: 'Damaged',
    productionGrade: 'Production Grade (Re-bought by company)',
    returnUnitPrice: 'Re-buy Unit Price (MMK)',
    returnClassificationDetails: 'Return Classification Details',
    confirmReturnProcessing: 'Confirm Return Processing',
    viewOnlyModeReturns: 'View-only Mode: Returns verification is restricted to administrators.',
    filteredReturnsLogs: 'Filtered Returns Logs',
    listOfIncomingReturns: 'List of incoming returns from outpost centers.',
    noReturnLogsMatch: 'No return logs match your current filters.',
    centralPipesCatalog: 'Pipe Models',
    updateProfileTitle: 'Update Profile Credentials',
    updateProfileSubtitle: 'Change your email address or password. If updating password, it must be at least 6 characters.',
    emailAddressLabel: 'Email Address',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    saveProfileBtn: 'Save Profile Changes',
    searchPipePlaceholder: 'Search pipe models...',
    searchVillagePlaceholder: 'Search village outposts...',
    pipeExistsMsg: 'This pipe model already exists in the catalog.',
    pipeAvailableMsg: 'This model name is available.',
    villageExistsMsg: 'This outpost name already exists in the network.',
    villageAvailableMsg: 'This outpost name is available.',
    configureStandardRates: 'Configure standard model rates or register and delete pipe models.',
    modelName: 'Model Name',
    currentPrice: 'Current Price',
    setCustomRate: 'Set Custom rate',
    action: 'Action',
    save: 'Save',
    delete: 'Delete',
    locked: 'Locked',
    registerNewCatalogModel: 'Register New Catalog Model',
    pipeModelName: 'Pipe Model Name',
    basePricePerUnit: 'Base Price per Unit (MMK)',
    addCatalogModel: 'Add Catalog Model',
    villageOutpostRegistry: 'Village Names',
    manageActiveNodes: 'Manage active nodes and outposts inside your distribution network.',
    outpostNode: 'Outpost Node',
    deleteOutpost: 'Delete Outpost',
    noVillageNodesRegistered: 'No village nodes registered.',
    registerNewOutpostNode: 'Register New Outpost Node',
    addOutpostNode: 'Add Outpost Node',
    operationalSystemAuditTrail: 'Operational System Audit Trail',
    chronologicalSecurityLogs: 'Chronological security logs of all actions performed inside the centralized inventory database node.',
    timestamp: 'Timestamp',
    actorUser: 'Actor User',
    operationAction: 'Operation Action',
    operationalDetails: 'Operational Details',
    noAuditEntriesLogged: 'No audit entries logged yet.',
    alertLowStock: 'Alert: Low Stock!',
    alertDamaged: 'Inspection Alert:',
    alertInfo: 'System Info:',
    saving: 'Saving...',
    addProduction: 'Record Production',
    addDistribution: 'Record Distribution',
    addReturn: 'Record Return',
    addCatalogItem: 'Add Catalog Item',
    newPipeModel: 'New Pipe Model',
    newOutpostNode: 'Add Village Name',
    editPrice: 'Edit Price',
    updatePrice: 'Update Price',
    savePrice: 'Save Price',
    editPriceTitle: 'Edit Model Price',
    currentBasePrice: 'Current Base Price',
    newBasePrice: 'New Base Price (MMK)',
    editProductionTitle: 'Edit Production Record',
    editDistributionTitle: 'Edit Distribution Delivery',
    editReturnTitle: 'Edit Return Record',
    confirmDeleteRecord: 'Are you sure you want to delete this record?',
    edit: 'Edit',
    reconciliation: 'Records',
    overallDistributeSummary: 'Overall records',
    whenAndWhenReturn: 'Track overall pipe distributions, precise return timings, and count of defective product errors.',
    villageName: 'Village Outpost',
    distributedOn: 'Distributed On',
    returnedOn: 'Returned On',
    totalDistributedPipes: 'Distributed Pipes',
    returnedRepaired: 'Returned',
    returnedDamaged: 'Error',
    noClaims: 'No records registered.',
    totalProduction: 'Total Production',
    currentBalance: 'Current Balance',
    reports: 'Reports',
    reportGenerationTitle: 'Corporate Activity Report',
    periodSelectLabel: 'Select Report Period:',
    reportTypeLabel: 'Report Type:',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    generateReportBtn: 'Generate Report',
    exportToExcelBtn: 'Export to Excel',
    exportToPdfBtn: 'Export to PDF',
    productionSummaryHeader: 'Production Activity Summary',
    distributionSummaryHeader: 'Distribution Outbound Summary',
    returnsSummaryHeader: 'Outpost Returns Summary',
    totalProducedUnits: 'Total Produced Units',
    totalDistributedUnits: 'Total Distributed Units',
    totalReturnedUnits: 'Total Returned Units',
    netInventoryChange: 'Net Inventory Change',
    leftToReturn: 'Left to Return to Company',
    noActivityPeriod: 'No activity registered for the selected reporting period.',
    fullyReturned: 'Fully Returned',
    batchIdLabel: 'Batch ID:',
    allBatches: 'All Batches',
    batchReportLabel: 'Batch Report:',
    damagedByVillageBatchModel: 'Most Damaged Outposts (Village, Batch, Model)',
    leftToReturnByBatchModel: 'Outstanding Balance to Return by Batch & Model',
    damagedQty: 'Damaged Qty',
    leftQty: 'Left Qty',
    noDamagedReturnsYet: 'No damaged returns logged yet.',
    allStockReturned: 'All distributed stock has been fully returned.',
    finance: 'Finance',
    financeOverview: 'Financial Performance & Re-buy Tracking',
    financeSubheading: 'Track sale revenues, outpost refund costs, and production vs re-buy price variances.',
    timePeriod: 'Time Period',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    allTime: 'All Time',
    totalRevenue: 'Total Production Price',
    totalRefunds: 'Total Re-Buy Cost',
    netProfit: 'Net Margin',
    refundRate: 'Production & Re-Buy Ratio',
    rebuyVsProduction: 'Re-buy Price vs Production Price Comparison',
    productionPrice: 'Production Price',
    averageRebuyPrice: 'Avg Re-buy Price',
    priceDifference: 'Difference',
    salesMarginAnalysis: 'Sales Margin vs Production Cost Analysis',
    averageSalesPrice: 'Avg Sales Price',
    salesMargin: 'Sales Margin',
    qtyDistributed: 'Qty Distributed',
    qtyReturned: 'Qty Returned',
    batchFinanceRatio: 'Batch-Specific Production & Re-buy Price Ratio',
    rebuyRatio: 'Re-buy Price Ratio',
    batchId: 'Batch ID',
    installApp: 'Install Mobile App',
    appInstalled: 'Installed Successfully',
    isOffline: 'Offline Mode',
    isOnline: 'Online',
    ferryCars: 'Ferry Cars',
    carNumber: 'Car Number',
    addCar: 'Register New Car',
    editCar: 'Edit Car Number',
    deleteCar: 'Delete Car',
    income: 'Income',
    expense: 'Expense',
    netIncome: 'Net Income',
    reason: 'Reason / Remark',
    amount: 'Amount (MMK)',
    date: 'Date',
    addExpense: 'Add Expense',
    addIncome: 'Add Income',
    allCars: 'All Cars',
    carPerformanceOverview: 'Ferry Cars Financial Performance Overview',
    ferryCarsSubheading: 'Track expenses, incomes, and net balances for all registered ferry cars.',
    recordExpenseTitle: 'Record Car Expense',
    recordIncomeTitle: 'Record Car Income',
    editExpenseTitle: 'Edit Car Expense',
    editIncomeTitle: 'Edit Car Income',
    selectCar: 'Select Ferry Car',
    noCarsRegistered: 'No ferry cars registered in the network.',
  },
  my: {
    overview: 'ခြုံငုံသုံးသပ်ချက်',
    production: 'ကုန်ထုတ်လုပ်မှု',
    distribution: 'ဖြန့်ဖြူးမှု',
    returns: 'ပြန်လည်အပ်နှံမှု',
    catalogSettings: 'ကတ်တလောက် ပြင်ဆင်ရန်',
    auditLogs: 'လုပ်ဆောင်မှု မှတ်တမ်း',
    role: 'အခန်းကဏ္ဍ',
    welcome: 'ပြန်လည်ကြိုဆိုပါတယ်',
    systemLocked: 'စနစ်အား ပိတ်ထားသည်',
    signOut: 'အကောင့်ထွက်ရန်',
    totalStock: 'စုစုပေါင်း လက်ကျန်',
    activeModels: 'အသုံးပြုနေသော မော်ဒယ်များ',
    distributedUnits: 'ဖြန့်ဖြူးပြီး အရေအတွက်',
    returnedStock: 'ပြန်အပ်နှံပြီး လက်ကျန်',
    weeklyDeliveryVelocity: 'အပတ်စဉ် ဖြန့်ဖြူးမှု အရှိန်',
    last7Days: 'လွန်ခဲ့သော ၇ ရက်အတွင်း လုပ်ဆောင်မှုများ',
    realTimeSystemAlerts: 'တိုက်ရိုက် စနစ်သတိပေးချက်များ',
    activeNotifications: 'အသက်ဝင်နေသော သတိပေးချက်များ',
    liveMetrics: 'တိုက်ရိုက် မက်ထရစ်များ',
    outpostsServed: 'ဝန်ဆောင်မှုပေးထားသော ကျေးရွာများ',
    totalDbRecords: 'စုစုပေါင်း မှတ်တမ်းအရေအတွက်',
    systemStatusOptimal: 'စနစ်အခြေအနေ ကောင်းမွန်ပါသည်။ စတော့ခ်သတိပေးချက်မရှိပါ။',
    recordCentralProduction: 'ဗဟိုစက်ရုံ ကုန်ထုတ်လုပ်မှု မှတ်တမ်း',
    logNewProductionOutputs: 'ကုန်ထုတ်လုပ်မှု အသစ်များကို မှတ်တမ်းတင်ပါ။ အက်ဒမင်ခွင့်ပြုချက် လိုအပ်သည်။',
    productionDate: 'ထုတ်လုပ်သည့် ရက်စွဲ',
    selectPipeModel: 'ပိုက်အမျိုးအစား ရွေးချယ်ပါ',
    quantityProducedUnits: 'ထုတ်လုပ်သည့် အရေအတွက် (ယူနစ်)',
    productionBatchId: 'ထုတ်လုပ်မှု အပတ်စဉ်နံပါတ် (Batch ID)',
    saveProductionBatch: 'ထုတ်လုပ်မှု အစုအဝေးကို သိမ်းဆည်းရန်',
    viewOnlyModeProduction: 'ကြည့်ရှုခွင့်သာမုဒ်- ကုန်ထုတ်လုပ်မှု ထည့်သွင်းခြင်းကို အက်ဒမင်များသာ ခွင့်ပြုသည်။',
    batchQualityControlRegistry: 'ထုတ်လုပ်မှုအစု QC စာရင်းဇယား',
    searchBatchId: 'အပတ်စဉ်နံပါတ်ဖြင့် ရှာဖွေရန်...',
    defectReturns: 'QC သတိပေးချက်- ချို့ယွင်းချက်ရှိ၍ ပြန်အပ်မှုများရှိနေသည်',
    passedQcInspection: 'QC စစ်ဆေးမှု အောင်မြင်သည်',
    noBatchesRegistered: 'ကုန်ထုတ်လုပ်မှု အပတ်စဉ် မှတ်တမ်း မရှိသေးပါ။',
    recordDistributionDelivery: 'ကုန်ပစ္စည်း ဖြန့်ဖြူးမှု မှတ်တမ်းတင်ရန်',
    outpost: 'ကျေးရွာ',
    pipeModel: 'ပိုက်မော်ဒယ်',
    startDate: 'စတင်သည့်ရက်စွဲ',
    endDate: 'ပြီးဆုံးမည့်ရက်စွဲ',
    classification: 'အမျိုးအစား ခွဲခြားမှု',
    allVillages: 'ကျေးရွာအားလုံး',
    allPipeModels: 'ပိုက်မော်ဒယ်အားလုံး',
    allStatuses: 'အခြေအနေအားလုံး',
    deliveryDate: 'ဖြန့်ဖြူးသည့် ရက်စွဲ',
    destinationOutpost: 'ဖြန့်ဖြူးမည့် ကျေးရွာ',
    selectStockPipeModel: 'စတော့ခ်ရှိ ပိုက်မော်ဒယ် ရွေးချယ်ပါ',
    quantityToDeliver: 'ဖြန့်ဖြူးမည့် အရေအတွက်',
    maximumFactoryAvailable: 'စက်ရုံတွင် အများဆုံး ရရှိနိုင်သော အရေအတွက်',
    autoCalculatedUnitPrice: 'ဖြန့်ဖြူးရေး ယူနစ်ဈေးနှုန်း (MMK)',
    originPoint: 'စတင်သည့်နေရာ',
    destinationStorage: 'ပေးပို့မည့်နေရာ',
    deliveryMemoRemarks: 'ဖြန့်ဖြူးမှု မှတ်စု / မှတ်ချက်များ',
    authorizeDistribution: 'ဖြန့်ဖြူးမှုကို အတည်ပြုရန်',
    viewOnlyModeAuthorizations: 'ကြည့်ရှုခွင့်သာမုဒ်- ဖြန့်ဖြူးမှု အတည်ပြုခြင်းကို အက်ဒမင်များသာ ခွင့်ပြုသည်။',
    filteredDistributionLogs: 'ဖြန့်ဖြူးမှု မှတ်တမ်းများ',
    listOfAllOutgoingOutpostDeliveries: 'ကျေးရွာများသို့ ပေးပို့ထားသော ဖြန့်ဖြူးမှု မှတ်တမ်းများ စာရင်း။',
    noDistributionRecords: 'ရှာဖွေထားသော သတ်မှတ်ချက်များနှင့် ကိုက်ညီသည့် ဖြန့်ဖြူးမှု မှတ်တမ်း မရှိပါ။',
    processOutpostReturns: 'ကျေးရွာများမှ ပြန်အပ်နှံမှုများ ဆောင်ရွက်ရန်',
    returnDate: 'ပြန်လည် အပ်နှံသည့် ရက်စွဲ',
    returningOutpost: 'ပြန်လည် အပ်နှံသည့် ကျေးရွာ',
    returnModelType: 'ပြန်လည် အပ်နှံသည့် မော်ဒယ်',
    quantityToReturn: 'ပြန်လည် အပ်နှံမည့် အရေအတွက်',
    villageBalanceCurrentlyDeployed: 'ကျေးရွာတွင် လက်ရှိ တပ်ဆင်ထားသော အရေအတွက်',
    inventoryClassification: 'ကုန်ပစ္စည်း အမျိုးအစား ခွဲခြားခြင်း',
    damagedScrapped: 'ပျက်စီး (ကျေးရွာသို့ ပြန်လည်ပေးပို့ - ဝယ်ယူမှုမရှိ)',
    productionGrade: 'ထုတ်လုပ်မှု အဆင့်မီ (ကုမ္ပဏီမှ ပြန်လည်ဝယ်ယူသည်)',
    returnUnitPrice: 'ပြန်လည်ဝယ်ယူသည့် ယူနစ်ဈေးနှုန်း (MMK)',
    returnClassificationDetails: 'ပြန်လည် အပ်နှံမှု အမျိုးအစား အသေးစိတ်',
    confirmReturnProcessing: 'ပြန်လည် အပ်နှံမှုကို အတည်ပြုရန်',
    viewOnlyModeReturns: 'ကြည့်ရှုခွင့်သာမုဒ်- ပြန်လည်အပ်နှံမှု အတည်ပြုခြင်းကို အက်ဒမင်များသာ ခွင့်ပြုသည်။',
    filteredReturnsLogs: 'ပြန်လည် အပ်နှံမှု မှတ်တမ်းများ',
    listOfIncomingReturns: 'ကျေးရွာများမှ ပြန်လည် လက်ခံရရှိသော အပ်နှံမှုများ စာရင်း။',
    noReturnLogsMatch: 'ရှာဖွေထားသော သတ်မှတ်ချက်များနှင့် ကိုက်ညီသည့် ပြန်အပ်နှံမှု မှတ်တမ်း မရှိပါ။',
    centralPipesCatalog: 'ဗဟို ပိုက်ကတ်တလောက်',
    updateProfileTitle: 'ပရိုဖိုင် အချက်အလက်များ ပြင်ဆင်ရန်',
    updateProfileSubtitle: 'သင်၏ အီးမေးလ်လိပ်စာ သို့မဟုတ် စကားဝှက်ကို ပြင်ဆင်ပါ။ စကားဝှက်အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်။',
    emailAddressLabel: 'အီးမေးလ် လိပ်စာ',
    newPasswordLabel: 'စကားဝှက်အသစ်',
    confirmPasswordLabel: 'စကားဝှက်အသစ်အား ထပ်မံရိုက်ထည့်ပါ',
    saveProfileBtn: 'ပရိုဖိုင် ပြင်ဆင်မှု သိမ်းဆည်းရန်',
    searchPipePlaceholder: 'ပိုက်မော်ဒယ်များ ရှာဖွေရန်...',
    searchVillagePlaceholder: 'ကျေးရွာအမည်များ ရှာဖွေရန်...',
    pipeExistsMsg: 'ဤပိုက်မော်ဒယ်အမည် ရှိနှင့်ပြီးသားဖြစ်သည်',
    pipeAvailableMsg: 'ဤအမည်အား အသုံးပြုနိုင်ပါသည်',
    villageExistsMsg: 'ဤကျေးရွာအမည် ရှိနှင့်ပြီးသားဖြစ်သည်',
    villageAvailableMsg: 'ဤအမည်အား အသုံးပြုနိုင်ပါသည်',
    configureStandardRates: 'စံနှုန်းများကို သတ်မှတ်ပါ (သို့မဟုတ်) ပိုက်မော်ဒယ်အသစ်များကို ထည့်သွင်း/ဖျက်သိမ်းပါ။',
    modelName: 'မော်ဒယ် အမည်',
    currentPrice: 'လက်ရှိ ဈေးနှုန်း',
    setCustomRate: 'စိတ်ကြိုက် ဈေးနှုန်း သတ်မှတ်ရန်',
    action: 'လုပ်ဆောင်ချက်',
    save: 'သိမ်းဆည်းရန်',
    delete: 'ဖျက်ရန်',
    locked: 'ပိတ်ထားသည်',
    registerNewCatalogModel: 'ပိုက်မော်ဒယ်အသစ် စာရင်းသွင်းရန်',
    pipeModelName: 'ပိုက်မော်ဒယ် အမည်',
    basePricePerUnit: 'အခြေခံ ယူနစ်ဈေးနှုန်း (MMK)',
    addCatalogModel: 'ကတ်တလောက်ထဲသို့ ထည့်သွင်းရန်',
    villageOutpostRegistry: 'ကျေးရွာ မှတ်ပုံတင်စာရင်း',
    manageActiveNodes: 'ဖြန့်ဖြူးရေးကွန်ရက်အတွင်းရှိ ကျေးရွာများကို စီမံခန့်ခွဲရန်။',
    outpostNode: 'ကျေးရွာအမည်',
    deleteOutpost: 'ကျေးရွာကို ဖျက်ရန်',
    noVillageNodesRegistered: 'ကျေးရွာ မှတ်ပုံတင်ထားခြင်း မရှိသေးပါ။',
    registerNewOutpostNode: 'ကျေးရွာအသစ် မှတ်ပုံတင်ရန်',
    addOutpostNode: 'ကျေးရွာ ထည့်သွင်းရန်',
    operationalSystemAuditTrail: 'စနစ်လုပ်ဆောင်မှု မှတ်တမ်းအပြည့်အစုံ',
    chronologicalSecurityLogs: 'ဗဟို ကုန်ပစ္စည်းထိန်းချုပ်ရေးစနစ်အတွင်း ဆောင်ရွက်ခဲ့သမျှသော လုံခြုံရေးမှတ်တမ်းများ။',
    timestamp: 'အချိန်မှတ်တမ်း',
    actorUser: 'လုပ်ဆောင်သူ အီးမေးလ်',
    operationAction: 'လုပ်ဆောင်မှု အမျိုးအစား',
    operationalDetails: 'လုပ်ဆောင်မှု အသေးစိတ် အချက်အလက်များ',
    noAuditEntriesLogged: 'လုပ်ဆောင်မှု မှတ်တမ်း မရှိသေးပါ။',
    alertLowStock: 'သတိပေးချက်- စတော့ခ် နည်းပါးနေသည်!',
    alertDamaged: 'စစ်ဆေးမှု သတိပေးချက်-',
    alertInfo: 'စနစ် အချက်အလက်-',
    saving: 'သိမ်းဆည်းနေပါသည်...',
    addProduction: '+ ကုန်ထုတ်လုပ်မှု မှတ်တမ်းတင်ရန်',
    addDistribution: '+ ဖြန့်ဖြူးမှု မှတ်တမ်းတင်ရန်',
    addReturn: '+ ပြန်အပ်နှံမှု မှတ်တမ်းတင်ရန်',
    addCatalogItem: '+ ကတ်တလောက်အသစ် ထည့်ရန်',
    newPipeModel: '+ ပိုက်မော်ဒယ်အသစ်',
    newOutpostNode: '+ ကျေးရွာအသစ်မှတ်ပုံတင်ရန်',
    editPrice: 'ဈေးနှုန်းပြင်ရန်',
    updatePrice: 'ဈေးနှုန်းပြင်ဆင်ရန်',
    savePrice: 'ဈေးနှုန်းသိမ်းဆည်းရန်',
    editPriceTitle: 'မော်ဒယ်ဈေးနှုန်း ပြင်ဆင်ရန်',
    currentBasePrice: 'လက်ရှိ အခြေခံဈေးနှုန်း',
    newBasePrice: 'ဈေးနှုန်းအသစ် (MMK)',
    editProductionTitle: 'ကုန်ထုတ်လုပ်မှုမှတ်တမ်း ပြင်ဆင်ရန်',
    editDistributionTitle: 'ဖြန့်ဖြူးမှုပေးပို့ချက် ပြင်ဆင်ရန်',
    editReturnTitle: 'ပြန်အပ်နှံမှုမှတ်တမ်း ပြင်ဆင်ရန်',
    confirmDeleteRecord: 'ဤမှတ်တမ်းအား ဖျက်သိမ်းရန် သေချာပါသလား?',
    edit: 'ပြင်ဆင်ရန်',
    reconciliation: 'ကျေးရွာ ပြန်လည်ညှိနှိုင်းမှု',
    overallDistributeSummary: 'အခြေအနေ ခြုံငုံသုံးသပ်ချက်',
    whenAndWhenReturn: 'ကျေးရွာများသို့ ဖြန့်ဖြူးမှုရက်စွဲ၊ ပြန်လည်အပ်နှံမှုရက်စွဲနှင့် ချို့ယွင်းချက်ရှိသော ကုန်ပစ္စည်းမှတ်တမ်း။',
    villageName: 'ကျေးရွာအမည်',
    distributedOn: 'ဖြန့်ဖြူးသည့် ရက်စွဲ',
    returnedOn: 'ပြန်အပ်သည့် ရက်စွဲ',
    totalDistributedPipes: 'ဖြန့်ဖြူးပြီး အရေအတွက်',
    returnedRepaired: 'ပြန်အပ်ပြီး',
    returnedDamaged: 'ချို့ယွင်းချက် (Error)',
    noClaims: 'ပြန်လည်ညှိနှိုင်းရန် မှတ်တမ်း မရှိပါ။',
    totalProduction: 'စုစုပေါင်း ထုတ်လုပ်မှု',
    currentBalance: 'လက်ရှိ လက်ကျန်',
    reports: 'အစီရင်ခံစာများ',
    reportGenerationTitle: 'လုပ်ငန်းဆောင်ရွက်မှု အစီရင်ခံစာ',
    periodSelectLabel: 'အစီရင်ခံစာ ကာလရွေးချယ်ရန်:',
    reportTypeLabel: 'အစီရင်ခံစာ အမျိုးအစား:',
    daily: 'နေ့စဉ်',
    weekly: 'အပတ်စဉ်',
    monthly: 'လစဉ်',
    generateReportBtn: 'အစီရင်ခံစာ ထုတ်ယူရန်',
    exportToExcelBtn: 'Excel သို့ ထုတ်ယူရန်',
    exportToPdfBtn: 'PDF သို့ ထုတ်ယူရန်',
    productionSummaryHeader: 'ထုတ်လုပ်မှု မှတ်တမ်းအကျဉ်း',
    distributionSummaryHeader: 'ဖြန့်ဖြူးမှု မှတ်တမ်းအကျဉ်း',
    returnsSummaryHeader: 'ပြန်အပ်နှံမှု မှတ်တမ်းအကျဉ်း',
    totalProducedUnits: 'စုစုပေါင်း ထုတ်လုပ်ပြီး အရေအတွက်',
    totalDistributedUnits: 'စုစုပေါင်း ဖြန့်ဖြူးပြီး အရေအတွက်',
    totalReturnedUnits: 'စုစုပေါင်း ပြန်အပ်နှံပြီး အရေအတွက်',
    netInventoryChange: 'လက်ကျန် ပြောင်းလဲမှု',
    leftToReturn: 'ပြန်အပ်ရန် ကျန်ရှိသော ကုန်ပစ္စည်း',
    noActivityPeriod: 'ရွေးချယ်ထားသော အစီရင်ခံစာကာလအတွင်း လုပ်ဆောင်မှု မရှိပါ။',
    fullyReturned: 'အပြည့်အဝပြန်အပ်ပြီး',
    batchIdLabel: 'အသုတ်နံပါတ်:',
    allBatches: 'အသုတ်အားလုံး',
    batchReportLabel: 'အသုတ်လိုက် အစီရင်ခံစာ:',
    damagedByVillageBatchModel: 'အများဆုံး ပျက်စီးမှုရှိသော ကျေးရွာများ (ကျေးရွာ၊ Batch ID၊ မော်ဒယ်)',
    leftToReturnByBatchModel: 'Batch ID နှင့် ပိုက်မော်ဒယ်အလိုက် ပြန်အပ်ရန်ကျန်ရှိမှု',
    damagedQty: 'ပျက်စီးအရေအတွက်',
    leftQty: 'ကျန်ရှိအရေအတွက်',
    noDamagedReturnsYet: 'ပျက်စီးသော ပြန်အပ်နှံမှုမှတ်တမ်း မရှိသေးပါ။',
    allStockReturned: 'ဖြန့်ဖြူးထားသော ပစ္စည်းများအားလုံး ပြန်အပ်ပြီးပါပြီ။',
    finance: 'ဘဏ္ဍာရေး',
    financeOverview: 'ဘဏ္ဍာရေး စွမ်းဆောင်ရည်နှင့် ပြန်လည်ဝယ်ယူမှု ခြေရာခံခြင်း',
    financeSubheading: 'ရောင်းရငွေများ၊ ပြန်အမ်းငွေကုန်ကျစရိတ်များနှင့် ထုတ်လုပ်မှုနှင့် ပြန်လည်ဝယ်ယူမှု စျေးနှုန်း ကွာခြားချက်များကို စောင့်ကြည့်ရန်။',
    timePeriod: 'အချိန်ကာလ',
    today: 'ယနေ့',
    thisWeek: 'ယခုအပတ်',
    thisMonth: 'ယခုလ',
    allTime: 'အချိန်အားလုံး',
    totalRevenue: 'စုစုပေါင်း အရောင်းရငွေ',
    totalRefunds: 'စုစုပေါင်း ပြန်ဝယ်ယူငွေ',
    netProfit: 'အသားတင် ကွာခြားမှု',
    refundRate: 'ထုတ်လုပ်မှုနှင့် ပြန်လည်ဝယ်ယူမှု အချိုးအစား',
    rebuyVsProduction: 'ပြန်လည်ဝယ်ယူစျေး နှင့် ထုတ်လုပ်မှုစျေး နှိုင်းယှဉ်ချက်',
    productionPrice: 'ထုတ်လုပ်မှုစျေး (Catalog)',
    averageRebuyPrice: 'ပျမ်းမျှ ပြန်လည်ဝယ်ယူစျေး',
    priceDifference: 'စျေးနှုန်းကွာခြားချက်',
    salesMarginAnalysis: 'ရောင်းစျေးနှင့် ထုတ်လုပ်မှုကုန်ကျစရိတ် နှိုင်းယှဉ်ချက်',
    averageSalesPrice: 'ပျမ်းမျှ ရောင်းစျေး',
    salesMargin: 'ရောင်းစျေး အမြတ်',
    qtyDistributed: 'ဖြန့်ဖြူးပြီး အရေအတွက်',
    qtyReturned: 'ပြန်အပ်ပြီး အရေအတွက်',
    batchFinanceRatio: 'ထုတ်လုပ်မှုအစုလိုက် (Batch) ထုတ်လုပ်မှုစျေးနှုန်းနှင့် ပြန်လည်ဝယ်ယူမှုစျေးနှုန်းအချိုး',
    rebuyRatio: 'ပြန်လည်ဝယ်ယူမှု စျေးနှုန်းအချိုး',
    batchId: 'အသုတ်နံပါတ် (Batch ID)',
    installApp: 'မိုဘိုင်းလ်အပ်ပ် ထည့်သွင်းရန်',
    appInstalled: 'ထည့်သွင်းမှု အောင်မြင်သည်',
    isOffline: 'အော့ဖ်လိုင်းမုဒ်',
    isOnline: 'အွန်လိုင်း',
    ferryCars: 'ဖယ်ရီကားများ',
    carNumber: 'ကားနံပါတ်',
    addCar: 'ကားအသစ်မှတ်ပုံတင်ရန်',
    editCar: 'ကားနံပါတ်ပြင်ဆင်ရန်',
    deleteCar: 'ကားဖျက်ရန်',
    income: 'ဝင်ငွေ',
    expense: 'အသုံးစရိတ် / ထွက်ငွေ',
    netIncome: 'အသားတင် ဝင်ငွေ',
    reason: 'အကြောင်းအရာ / မှတ်ချက်',
    amount: 'ပမာဏ (ကျပ်)',
    date: 'ရက်စွဲ',
    addExpense: 'အသုံးစရိတ်ထည့်ရန်',
    addIncome: 'ဝင်ငွေထည့်ရန်',
    allCars: 'ကားအားလုံး',
    carPerformanceOverview: 'ဖယ်ရီကားများ၏ ဘဏ္ဍာရေးအခြေအနေ ခြုံငုံသုံးသပ်ချက်',
    ferryCarsSubheading: 'ဖယ်ရီကားများ၏ ဝင်ငွေ၊ အသုံးစရိတ်နှင့် အသားတင်ကျန်ရှိမှုများကို စောင့်ကြည့်ရန်။',
    recordExpenseTitle: 'ကားအသုံးစရိတ် စာရင်းသွင်းရန်',
    recordIncomeTitle: 'ကားဝင်ငွေ စာရင်းသွင်းရန်',
    editExpenseTitle: 'ကားအသုံးစရိတ် ပြင်ဆင်ရန်',
    editIncomeTitle: 'ကားဝင်ငွေ ပြင်ဆင်ရန်',
    selectCar: 'ဖယ်ရီကား ရွေးချယ်ပါ',
    noCarsRegistered: 'မှတ်ပုံတင်ထားသော ဖယ်ရီကား မရှိသေးပါ။',
  }
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-MM', {
    style: 'currency',
    currency: 'MMK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAuditTimestamp(timestampStr: string) {
  if (!timestampStr) return '';
  const dateStr = (timestampStr.includes('Z') || timestampStr.match(/[+-]\d{2}:?\d{2}$/))
    ? timestampStr
    : `${timestampStr.replace(' ', 'T')}Z`;
  try {
    return new Date(dateStr).toLocaleString(undefined, { timeZone: 'Asia/Yangon' });
  } catch (e) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return timestampStr;
    }
  }
}

function sumQuantity(records: { quantity: number }[]) {
  return records.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
}

function getLocalTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function InventoryApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Auth, Localization & Session States ---
  const [user, setUser] = useState<{ email: string; role: 'admin' | 'viewer' } | null>(null);
  const [language, setLanguage] = useState<'en' | 'my'>('en');
  const t = TRANSLATIONS[language];
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(false);

  // --- Sidebar & Data Tabs ---
  const sidebarTabs = user?.role === 'admin' ? ADMIN_TABS : VIEWER_TABS;
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileOpen(false); // Close profile dropdown when activeTab changes
  }, [activeTab]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar-profile-container')) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isProfileOpen]);

  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      const isIosChrome = isIos && /CriOS/i.test(navigator.userAgent);
      const isIosFirefox = isIos && /FxiOS/i.test(navigator.userAgent);

      // Only set installable initially if deferredPwaPrompt exists and not on iOS Chrome/Firefox,
      // or if it's iOS Safari (not standalone, and not Chrome/Firefox on iOS)
      if (window.deferredPwaPrompt && !isIosChrome && !isIosFirefox) {
        setIsInstallable(true);
      } else if (isIos && !isStandalone && !isIosChrome && !isIosFirefox) {
        setIsInstallable(true);
      }
      
      const handleInstallReady = () => {
        const currentIsIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const currentIsIosChrome = currentIsIos && /CriOS/i.test(navigator.userAgent);
        const currentIsIosFirefox = currentIsIos && /FxiOS/i.test(navigator.userAgent);
        if (!currentIsIosChrome && !currentIsIosFirefox) {
          setIsInstallable(true);
        }
      };
      
      const handleInstallSuccess = () => setIsInstallable(false);
      
      const handleNetworkStatus = (e: any) => {
        setIsOffline(!e.detail.online);
      };

      window.addEventListener('pwa-install-ready', handleInstallReady);
      window.addEventListener('pwa-installed-success', handleInstallSuccess);
      window.addEventListener('pwa-network-status', handleNetworkStatus as EventListener);

      setIsOffline(!navigator.onLine);

      return () => {
        window.removeEventListener('pwa-install-ready', handleInstallReady);
        window.removeEventListener('pwa-installed-success', handleInstallSuccess);
        window.removeEventListener('pwa-network-status', handleNetworkStatus as EventListener);
      };
    }
  }, []);

  // --- Inventory, Outpost & Log Data States ---
  const [pipeTypes, setPipeTypes] = useState<PipeType[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  const [fundingList, setFundingList] = useState<VillageFundingRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Ferry Car States
  const [cars, setCars] = useState<Car[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [carIncomes, setCarIncomes] = useState<CarIncome[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | 'all'>('all');

  const [carForm, setCarForm] = useState({
    carNumber: '',
  });

  const [carExpenseForm, setCarExpenseForm] = useState({
    date: getLocalTodayDateString(),
    carId: 0,
    amount: 0,
    reason: '',
  });

  const [carIncomeForm, setCarIncomeForm] = useState({
    date: getLocalTodayDateString(),
    carId: 0,
    amount: 0,
    reason: '',
  });

  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editingCarExpense, setEditingCarExpense] = useState<CarExpense | null>(null);
  const [editingCarIncome, setEditingCarIncome] = useState<CarIncome | null>(null);

  const [fundingForm, setFundingForm] = useState({
    date: '',
    village: '',
    type: 'disbursement' as 'disbursement' | 'repayment',
    amount: 0,
    remark: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<'production' | 'distribution' | 'return' | 'new_pipe' | 'new_outpost' | 'edit_price' | 'edit_production' | 'edit_distribution' | 'edit_return' | 'edit_funding' | 'edit_village' | 'update_profile' | 'new_car' | 'edit_car' | 'new_car_expense' | 'edit_car_expense' | 'new_car_income' | 'edit_car_income' | null>(null);

  // --- Profile Edit Modal States ---
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileEmailError, setProfileEmailError] = useState<string | null>(null);
  const [profilePasswordError, setProfilePasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal === null) {
      setDistType('normal');
      setSelectedDamagedReturnId('');
    }
  }, [activeModal]);
  const [editingPipe, setEditingPipe] = useState<PipeType | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number | ''>('');

  const [editingProduction, setEditingProduction] = useState<ProductionRecord | null>(null);
  const [editProductionForm, setEditProductionForm] = useState({
    id: 0,
    date: '',
    pipeTypeId: 0,
    quantity: 0,
    batchId: '',
  });

  const [editingDistribution, setEditingDistribution] = useState<DistributionRecord | null>(null);
  const [editDistributionForm, setEditDistributionForm] = useState({
    id: 0,
    date: '',
    village: '',
    pipeTypeId: 0,
    quantity: 0,
    price: 0,
    fromLocation: '',
    toLocation: '',
    remark: '',
    batchId: '',
  });

  const [editingReturn, setEditingReturn] = useState<ReturnRecord | null>(null);
  const [editReturnForm, setEditReturnForm] = useState({
    id: 0,
    date: '',
    village: '',
    pipeTypeId: 0,
    quantity: 0,
    status: 'production_grade' as 'damaged' | 'production_grade',
    price: 0,
    remark: '',
    batchId: '',
  });

  const [editingFunding, setEditingFunding] = useState<VillageFundingRecord | null>(null);
  const [editFundingForm, setEditFundingForm] = useState({
    id: 0,
    date: '',
    village: '',
    type: 'disbursement' as 'disbursement' | 'repayment',
    amount: 0,
    remark: '',
  });

  const openEditPriceModal = (pipe: PipeType) => {
    setEditingPipe(pipe);
    setEditPriceValue(pipe.unit_price);
    setActiveModal('edit_price');
  };

  const openEditVillageModal = (village: Village) => {
    setEditingVillage(village);
    setEditVillageName(village.name);
    setActiveModal('edit_village');
  };

  const handleVillageEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVillage || !editVillageName.trim()) return;
    if (editVillageExists) {
      alert(language === 'my' ? 'ဤကျေးရွာအမည် ရှိနှင့်ပြီးသားဖြစ်သည်' : 'This outpost name already exists in the network.');
      return;
    }
    const trimmedName = editVillageName.trim();
    if (trimmedName === editingVillage.name) {
      setActiveModal(null);
      setEditingVillage(null);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/villages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingVillage.id, name: trimmedName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update village name.');
      }
      setMessage(language === 'my' ? 'ကျေးရွာအမည် ပြင်ဆင်ပြီးပါပြီ။' : 'Village name successfully updated.');
      
      // Refresh villages list and other references
      await Promise.all([
        loadVillages(),
        loadData(),
      ]);

      setActiveModal(null);
      setEditingVillage(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating village.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditProductionModal = (prod: ProductionRecord) => {
    setEditingProduction(prod);
    setEditProductionForm({
      id: prod.id,
      date: prod.date,
      pipeTypeId: prod.pipe_type_id,
      quantity: prod.quantity,
      batchId: prod.batch_id || '',
    });
    setActiveModal('edit_production');
  };

  const openEditDistributionModal = (dist: DistributionRecord) => {
    setEditingDistribution(dist);
    setEditDistributionForm({
      id: dist.id,
      date: dist.date,
      village: dist.village,
      pipeTypeId: dist.pipe_type_id,
      quantity: dist.quantity,
      price: dist.price,
      fromLocation: dist.from_location || '',
      toLocation: dist.to_location || '',
      remark: dist.remark || '',
      batchId: dist.batch_id || '',
    });
    setActiveModal('edit_distribution');
  };

  const openEditReturnModal = (ret: ReturnRecord) => {
    setEditingReturn(ret);
    setEditReturnForm({
      id: ret.id,
      date: ret.date,
      village: ret.village,
      pipeTypeId: ret.pipe_type_id,
      quantity: ret.quantity,
      status: ret.status,
      price: ret.price || 0,
      remark: ret.remark || '',
      batchId: ret.batch_id || '',
    });
    setActiveModal('edit_return');
  };

  const openEditFundingModal = (record: VillageFundingRecord) => {
    setEditingFunding(record);
    setEditFundingForm({
      id: record.id,
      date: record.date,
      village: record.village,
      type: record.type,
      amount: record.amount,
      remark: record.remark || '',
    });
    setActiveModal('edit_funding');
  };

  const submitEditForm = async (url: string, body: object, reset?: () => void) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to update the record.');
      } else {
        setMessage(language === 'my' ? 'မှတ်တမ်း ပြင်ဆင်ပြီးပါပြီ။' : 'Record updated successfully.');
        if (reset) reset();
        await loadData();
        await loadVillages();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server error while updating the record.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async (url: string, confirmText: string) => {
    if (!confirm(confirmText)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete the record.');
      } else {
        setMessage(language === 'my' ? 'မှတ်တမ်း ဖျက်သိမ်းပြီးပါပြီ။' : 'Record deleted successfully.');
        await loadData();
        await loadVillages();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server error while deleting the record.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductionEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEditForm('/api/production', {
      id: editProductionForm.id,
      date: editProductionForm.date,
      pipeTypeId: editProductionForm.pipeTypeId,
      quantity: editProductionForm.quantity,
      batchId: editProductionForm.batchId,
    }, () => {
      setActiveModal(null);
      setEditingProduction(null);
    });
  };

  const handleDistributionEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEditForm('/api/distribution', {
      id: editDistributionForm.id,
      date: editDistributionForm.date,
      village: editDistributionForm.village,
      batchId: editDistributionForm.batchId,
      quantity: editDistributionForm.quantity,
      price: editDistributionForm.price,
      fromLocation: editDistributionForm.fromLocation,
      toLocation: editDistributionForm.toLocation,
      remark: editDistributionForm.remark,
    }, () => {
      setActiveModal(null);
      setEditingDistribution(null);
    });
  };

  const handleReturnEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const remarkToSend = editReturnHasResent
      ? (editReturnForm.remark.includes('is-resent') ? editReturnForm.remark : (editReturnForm.remark ? `${editReturnForm.remark} is-resent` : 'is-resent'))
      : editReturnForm.remark;

    await submitEditForm('/api/returns', {
      id: editReturnForm.id,
      date: editReturnForm.date,
      village: editReturnForm.village,
      batchId: editReturnForm.batchId,
      quantity: editReturnForm.quantity,
      status: editReturnForm.status,
      price: editReturnForm.price,
      remark: remarkToSend,
    }, () => {
      setActiveModal(null);
      setEditingReturn(null);
    });
  };

  const handleFundingEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFundingForm.date || !editFundingForm.village || !editFundingForm.type || !editFundingForm.amount) {
      alert(language === 'my' ? 'အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်စွက်ပါ' : 'Please fill all required fields.');
      return;
    }
    await submitEditForm('/api/village-funding', editFundingForm, () => {
      setActiveModal(null);
      setEditingFunding(null);
    });
  };

  // --- CRUD Input States (Add model / Add village) ---
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipePrice, setNewPipePrice] = useState<number | ''>('');
  const [newVillageName, setNewVillageName] = useState('');

  // --- Search & Filtering States ---
  const [filterVillage, setFilterVillage] = useState('All');
  const [filterPipeType, setFilterPipeType] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isSpecificDate, setIsSpecificDate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); // For returns
  const [searchBatchId, setSearchBatchId] = useState(''); // For production QC search
  const [filterBatchId, setFilterBatchId] = useState('All');
  const [filterReconType, setFilterReconType] = useState<'All' | 'Distributions' | 'Returns'>('All');
  const [searchDistributionQuery, setSearchDistributionQuery] = useState('');
  const [searchReturnsQuery, setSearchReturnsQuery] = useState('');
  const [searchReconciliationQuery, setSearchReconciliationQuery] = useState('');
  const [searchPipeQuery, setSearchPipeQuery] = useState('');
  const [searchVillageQuery, setSearchVillageQuery] = useState('');
  const [financePeriod, setFinancePeriod] = useState<'day' | 'week' | 'month' | 'all' | 'custom'>('month');
  
  // --- Cash Flow Search & Filtering States ---
  const [filterFundingVillage, setFilterFundingVillage] = useState('All');
  const [filterFundingType, setFilterFundingType] = useState('All');
  const [filterFundingStartDate, setFilterFundingStartDate] = useState('');
  const [filterFundingEndDate, setFilterFundingEndDate] = useState('');

  // --- Form Input States ---
  const [productionForm, setProductionForm] = useState({
    date: '',
    pipeTypeId: 0,
    quantity: 0,
    batchId: '',
  });

  const [distributionForm, setDistributionForm] = useState({
    date: '',
    village: '',
    pipeTypeId: 0,
    quantity: 0,
    price: 0,
    fromLocation: 'Factory',
    toLocation: 'Village Store',
    remark: '',
    batchId: '',
  });

  const [distType, setDistType] = useState<'normal' | 'resend_damaged'>('normal');
  const [selectedDamagedReturnId, setSelectedDamagedReturnId] = useState<string>('');

  const [returnForm, setReturnForm] = useState({
    date: '',
    village: '',
    pipeTypeId: 0,
    status: 'production_grade',
    quantity: 0,
    price: 0,
    remark: '',
    batchId: '',
  });

  const [returnPriceMode, setReturnPriceMode] = useState<'plus10' | 'manual'>('plus10');

  const [priceForm, setPriceForm] = useState({
    pipeTypeId: 0,
    unitPrice: 0,
  });

  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'distribution_left' | 'custom'>('daily');
  const [reportDate, setReportDate] = useState('');
  const [reportVillage, setReportVillage] = useState<string>('All');
  const [reportPipeTypeId, setReportPipeTypeId] = useState<string>('All');
  const [reportBatchId, setReportBatchId] = useState<string>('All');

  // --- Backup & Recovery States ---
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isBackupCreating, setIsBackupCreating] = useState(false);
  const [isBackupRestoring, setIsBackupRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupIntervalDays, setBackupIntervalDays] = useState(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // --- Catalog Settings Sub-Tabs & Editing States ---
  const [catalogSubTab, setCatalogSubTab] = useState<'pipes' | 'villages'>('pipes');
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [editVillageName, setEditVillageName] = useState<string>('');

  // --- Pagination State & Helpers ---
  const [pages, setPages] = useState<Record<string, number>>({});
  const [pageSizes, setPageSizes] = useState<Record<string, number>>({});
  const [isPrinting, setIsPrinting] = useState(false);

  const getPage = (key: string) => pages[key] || 1;
  const setPage = (key: string, pageNum: number) => {
    setPages((prev) => ({ ...prev, [key]: pageNum }));
  };

  const getPageSize = (key: string) => pageSizes[key] || 10;
  const setPageSize = (key: string, size: number) => {
    setPageSizes((prev) => ({ ...prev, [key]: size }));
    setPage(key, 1); // Reset page to 1 when changing page size
  };

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    setPage('modalProd', 1);
    setPage('modalDist', 1);
    setPage('modalRet', 1);
  }, [viewingBatchId]);

  const PaginationControls = ({ tableKey, totalItems }: { tableKey: string; totalItems: number }) => {
    const currentPage = getPage(tableKey);
    const pageSize = getPageSize(tableKey);
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    // Generate page numbers to display
    const pagesToShow: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
      pagesToShow.push(1);
      if (currentPage > 3) {
        pagesToShow.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pagesToShow.includes(i)) pagesToShow.push(i);
      }
      if (currentPage < totalPages - 2) {
        pagesToShow.push('...');
      }
      if (!pagesToShow.includes(totalPages)) pagesToShow.push(totalPages);
    }

    return (
      <div className="pagination-container no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0 0 12px 12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {language === 'my' ? 'ပြသမည် -' : 'Show'}
          </span> */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(tableKey, Number(e.target.value))}
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              width: 'auto',
              cursor: 'pointer'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={999999}>{language === 'my' ? 'အားလုံး' : 'All'}</option>
          </select>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {language === 'my' ? 'တန်း' : 'rows'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {language === 'my' 
              ? `စုစုပေါင်းမှတ်တမ်း ${totalItems} ခုအနက် စာမျက်နှာ ${currentPage} / ${totalPages}`
              : ` ${currentPage} of ${totalPages} (${totalItems} items)`}
          </span>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setPage(tableKey, currentPage - 1)}
              >
                {language === 'my' ? 'ယခင်' : 'Prev'}
              </button>
              {pagesToShow.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        userSelect: 'none'
                      }}
                    >
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                    onClick={() => typeof p === 'number' && setPage(tableKey, p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage(tableKey, currentPage + 1)}
              >
                {language === 'my' ? 'နောက်သို့' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Tab Dynamic Text ---
  const PAGE_TITLES: Record<string, Record<'en' | 'my', string>> = {
    Overview: { en: 'Live Inventory Analytics', my: 'တိုက်ရိုက် ကုန်ပစ္စည်း စာရင်း' },
    Production: { en: 'Record Central Factory Production', my: 'ဗဟိုစက်ရုံ ကုန်ထုတ်လုပ်မှု မှတ်တမ်း' },
    Distribution: { en: 'Record Distribution Delivery', my: 'ကုန်ပစ္စည်း ဖြန့်ဖြူးမှု မှတ်တမ်းတင်ရန်' },
    Returns: { en: 'Village Returns Tracking', my: 'ကျေးရွာများမှ ပြန်အပ်နှံမှုများ ဆောင်ရွက်ရန်' },
    Reconciliation: { en: 'Overall report', my: 'ကျေးရွာအလိုက် ဖြန့်ဖြူးမှုနှင့် အခြေအနေ ခြုံငုံသုံးသပ်ချက်' },
    Reports: { en: 'Corporate Inventory Reports', my: 'လုပ်ငန်းဆိုင်ရာ အစီရင်ခံစာများ' },
    Finance: { en: 'Financial Performance & Re-buy Tracking', my: 'ဘဏ္ဍာရေး စွမ်းဆောင်ရည်နှင့် ပြန်လည်ဝယ်ယူမှု ခြေရာခံခြင်း' },
    'Catalog Settings': { en: 'Central Catalog Settings', my: 'ဗဟို ကတ်တလောက် ပြင်ဆင်ရန်' },
    'Audit Logs': { en: 'Administrator Audit Trail', my: 'အက်ဒမင် လုပ်ဆောင်မှု မှတ်တမ်း' },
    'Backup & Recovery': { en: 'Database Backup & Recovery', my: 'ဒေတာဘေ့စ် သိမ်းဆည်းခြင်းနှင့် ပြန်လည်ရယူခြင်း' },
  };

  const PAGE_SUBHEADINGS: Record<string, Record<'en' | 'my', string>> = {
  
    'Audit Logs': {
      en: 'Audit record of all creations, price updates, and distribution authorizations.',
      my: 'ထုတ်လုပ်မှုများ၊ ဈေးနှုန်းပြင်ဆင်မှုများနှင့် ဖြန့်ဖြူးမှုအတည်ပြုချက်များ၏ လုံခြုံရေးမှတ်တမ်း။',
    },
    'Backup & Recovery': {
      en: 'Manage database snapshots, export Excel reports, or upload spreadsheet backups to restore the database data.',
      my: 'ဒေတာဘေ့စ် မှတ်တမ်းများကို စီမံခန့်ခွဲရန်၊ Excel အစီရင်ခံစာများ ထုတ်ယူရန် သို့မဟုတ် ဒေတာဘေ့စ်ပြန်လည်ရယူရန် Excel ဖိုင်တင်သွင်းရန်။',
    }
  };

  // --- Session Verification On Mount ---
  const verifySession = async () => {
    try {
      // Fast path: if the user does not have a logged in hint, skip the network request
      const sessionHint = typeof window !== 'undefined' ? localStorage.getItem('pf_logged_in') : null;
      if (!sessionHint) {
        setUser(null);
        setIsSessionChecking(false);
        return;
      }

      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (response.ok && data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem('pf_logged_in');
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsSessionChecking(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  // Auto-clear notification messages after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- Set Tab from Query Params ---
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && sidebarTabs.includes(tabParam as any)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('Overview');
    }
  }, [searchParams, sidebarTabs]);

  const priceMap = useMemo(
    () => pipeTypes.reduce<Record<number, number>>((acc, pipe) => {
      acc[pipe.id] = pipe.unit_price;
      return acc;
    }, {}),
    [pipeTypes]
  );

  const loadVillages = async () => {
    try {
      const response = await fetch('/api/villages');
      const data = await response.json();
      if (response.ok && data.villages) {
        const list = data.villages as Village[];
        setVillages(list);
        if (list.length > 0) {
          setDistributionForm((prev) => ({ ...prev, village: list[0].name }));
          setReturnForm((prev) => ({ ...prev, village: list[0].name }));
          setFundingForm((prev) => ({ ...prev, village: list[0].name }));
        }
      }
    } catch (error) {
      console.error('Failed to load villages list:', error);
    }
  };

  const loadData = async () => {
    if (!supabase) return;
    try {
      const [pipeTypesRes, productionsRes, distributionsRes, returnsRes] = await Promise.all([
        supabase.from('pipe_types').select('*').order('name', { ascending: true }),
        supabase.from('productions').select('*').order('date', { ascending: false }),
        supabase.from('distributions').select('*').order('date', { ascending: false }),
        supabase.from('returns').select('*').order('date', { ascending: false }),
      ]);

      if (!pipeTypesRes.error && pipeTypesRes.data) {
        const types = pipeTypesRes.data as PipeType[];
        setPipeTypes(types);
        if (types.length > 0) {
          setProductionForm((prev) => ({ ...prev, pipeTypeId: types[0].id }));
          setDistributionForm((prev) => ({ 
            ...prev, 
            pipeTypeId: types[0].id,
            price: types[0].unit_price 
          }));
          setReturnForm((prev) => ({
            ...prev,
            pipeTypeId: types[0].id,
            price: types[0].unit_price,
            status: 'production_grade',
            quantity: 0,
          }));
          setPriceForm((prev) => ({ ...prev, pipeTypeId: types[0].id }));
        }
      }
      if (!productionsRes.error && productionsRes.data) {
        setProductions(productionsRes.data as ProductionRecord[]);
      }
      if (!distributionsRes.error && distributionsRes.data) {
        setDistributions(distributionsRes.data as DistributionRecord[]);
      }
      if (!returnsRes.error && returnsRes.data) {
        setReturnsList(returnsRes.data as ReturnRecord[]);
      }
      // Fetch funding records from API
      try {
        const fundingRes = await fetch('/api/village-funding');
        if (fundingRes.ok) {
          const fundingData = await fundingRes.json();
          if (fundingData.funding) {
            setFundingList(fundingData.funding);
          }
        }
      } catch (err) {
        console.error('Failed to load funding records:', err);
      }

      // Fetch ferry car data from API
      try {
        const [carsRes, expensesRes, incomesRes] = await Promise.all([
          fetch('/api/cars').then(r => r.json().catch(() => ({}))),
          fetch('/api/car-expenses').then(r => r.json().catch(() => ({}))),
          fetch('/api/car-incomes').then(r => r.json().catch(() => ({})))
        ]);
        if (carsRes.cars) {
          setCars(carsRes.cars);
        }
        if (expensesRes.expenses) {
          setCarExpenses(expensesRes.expenses);
        }
        if (incomesRes.incomes) {
          setCarIncomes(incomesRes.incomes);
        }
      } catch (err) {
        console.error('Failed to load ferry car data:', err);
      }
    } catch (error) {
      console.warn('Supabase fetch failed; using fallback data.', error);
    }
  };

  const loadAuditLogs = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await fetch('/api/audit-logs');
      const data = await response.json();
      if (response.ok && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const loadAllData = async () => {
    setIsDataLoading(true);
    try {
      await new Promise(r => setTimeout(r, 4000));
      await Promise.all([
        loadData(),
        loadVillages(),
        user?.role === 'admin' ? loadAuditLogs() : Promise.resolve(),
      ]);
      if (user?.role === 'admin') {
        fetch('/api/backup').catch((err) => console.error('Auto backup check failed:', err));
      }
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const renderSkeleton = (style?: React.CSSProperties) => {
    return <div className="skeleton-box" style={style} />;
  };

  const renderTableSkeleton = (colCount: number, rowCount: number = 5) => {
    return Array.from({ length: rowCount }).map((_, rIdx) => (
      <tr key={rIdx}>
        {Array.from({ length: colCount }).map((_, cIdx) => {
          const widths = ['80%', '60%', '70%', '50%', '90%', '40%'];
          const width = widths[(rIdx + cIdx) % widths.length];
          return (
            <td key={cIdx}>
              <div className="skeleton-box" style={{ width }} />
            </td>
          );
        })}
      </tr>
    ));
  };

  const loadBackupsList = async () => {
    setIsBackupLoading(true);
    setBackupMessage(null);
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      if (response.ok && data.backups) {
        setBackups(data.backups);
        if (data.settings) {
          setAutoBackupEnabled(data.settings.autoBackup);
          setBackupIntervalDays(data.settings.intervalDays);
        }
      } else {
        setBackupMessage(data.error || 'Failed to load backups.');
      }
    } catch (error) {
      setBackupMessage('Failed to fetch backups from server.');
      console.error(error);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleSaveBackupSettings = async (auto: boolean, days: number) => {
    setIsSavingSettings(true);
    setBackupMessage(null);
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoBackup: auto, intervalDays: days }),
      });
      const data = await response.json();
      if (response.ok && data.settings) {
        setAutoBackupEnabled(data.settings.autoBackup);
        setBackupIntervalDays(data.settings.intervalDays);
        setBackupMessage(language === 'my' 
          ? 'Backup လုပ်ဆောင်ချက် ဆက်တင်များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။' 
          : 'Backup settings saved successfully.');
      } else {
        setBackupMessage(data.error || 'Failed to save settings.');
      }
    } catch (error) {
      setBackupMessage('Error saving backup settings.');
      console.error(error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackupCreating(true);
    setBackupMessage(null);
    try {
      const response = await fetch('/api/backup', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setBackupMessage(language === 'my' ? 'ဒေတာဘေ့စ် သိမ်းဆည်းမှု အောင်မြင်ပါသည်။' : 'Database backup snapshot created successfully.');
        await loadBackupsList();
      } else {
        setBackupMessage(data.error || 'Failed to create backup.');
      }
    } catch (error) {
      setBackupMessage('Error creating database snapshot.');
      console.error(error);
    } finally {
      setIsBackupCreating(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(language === 'my' ? `သိမ်းဆည်းထားသောဖိုင် "${filename}" ကို ဖျက်ရန် သေချာပါသလား?` : `Are you sure you want to delete backup file "${filename}"?`)) return;
    setBackupMessage(null);
    try {
      const response = await fetch(`/api/backup?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setBackupMessage(language === 'my' ? 'သိမ်းဆည်းထားသောဖိုင် ဖျက်ပြီးပါပြီ။' : 'Backup file deleted successfully.');
        await loadBackupsList();
      } else {
        setBackupMessage(data.error || 'Failed to delete backup.');
      }
    } catch (error) {
      setBackupMessage('Error deleting backup file.');
      console.error(error);
    }
  };

  const handleDownloadJson = (filename: string) => {
    window.open(`/api/backup/download?filename=${encodeURIComponent(filename)}`, '_blank');
  };

  const handleExportExcelBackup = (filename: string) => {
    window.open(`/api/backup/export-excel?filename=${encodeURIComponent(filename)}`, '_blank');
  };

  const handleImportExcelBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(language === 'my' 
      ? 'သတိပေးချက် - ဤလုပ်ဆောင်ချက်သည် လက်ရှိဒေတာဘေ့စ်မှတ်တမ်းများကို ပြန်လည်ရေးသား/ဖြည့်စွက်ပါမည်။ ဆက်လုပ်ရန် သေਚာပါသလား?' 
      : 'WARNING: This will overwrite or upsert current database records. Are you sure you want to restore data from this Excel backup file?')) {
      e.target.value = '';
      return;
    }

    setIsBackupRestoring(true);
    setBackupMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        const counts = data.results;
        const msg = language === 'my'
          ? `ဒေတာဘေ့စ် ပြန်လည်ရယူခြင်း အောင်မြင်ပါသည်။ ထည့်သွင်းပြီးမှတ်တမ်းများ: ${JSON.stringify(counts)}`
          : `Database restored successfully. Imported: Pipe Types (${counts.pipe_types || 0}), Villages (${counts.villages || 0}), Productions (${counts.productions || 0}), Distributions (${counts.distributions || 0}), Returns (${counts.returns || 0}), Audit Logs (${counts.audit_logs || 0}), Users (${counts.app_users || 0})`;
        setBackupMessage(msg);
        // Reload all app data
        await loadData();
        await loadVillages();
        await loadAuditLogs();
      } else {
        setBackupMessage(data.error || 'Failed to restore database.');
      }
    } catch (error) {
      setBackupMessage('Error restoring data from backup file.');
      console.error(error);
    } finally {
      setIsBackupRestoring(false);
      e.target.value = '';
    }
  };

  // Reload data when user logs in successfully
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Load backups list when visiting the Backup tab
  useEffect(() => {
    if (activeTab === 'Backup & Recovery' && user?.role === 'admin') {
      loadBackupsList();
    }
  }, [activeTab, user]);

  // Set form dates dynamically on client-mount to prevent hydration mismatches
  useEffect(() => {
    const today = getLocalTodayDateString();
    setProductionForm((prev) => ({ ...prev, date: today }));
    setDistributionForm((prev) => ({ ...prev, date: today }));
    setReturnForm((prev) => ({ ...prev, date: today }));
    setFundingForm((prev) => ({ ...prev, date: today }));
    setReportDate(today);
  }, []);

  // Auto-generate batch_id based on production date and model_name
  useEffect(() => {
    const selectedPipe = pipeTypes.find(pt => pt.id === productionForm.pipeTypeId);
    if (selectedPipe && productionForm.date) {
      const cleanName = selectedPipe.name.trim().replace(/\s+/g, '-');
      const autoBatchId = `${productionForm.date}-${cleanName}`;
      setProductionForm(prev => ({ ...prev, batchId: autoBatchId }));
    }
  }, [productionForm.date, productionForm.pipeTypeId, pipeTypes]);

  // Auto-calculate re-buy price (plus 10% of catalog price) when returned
  useEffect(() => {
    if (returnPriceMode === 'plus10') {
      const basePrice = priceMap[returnForm.pipeTypeId] || 0;
      const calculatedPrice = Number((basePrice * 1.1).toFixed(2));
      setReturnForm(prev => ({ ...prev, price: calculatedPrice }));
    }
  }, [returnForm.pipeTypeId, returnPriceMode, priceMap]);

  const factoryStockMap = useMemo(() => {
    const totals = pipeTypes.reduce<Record<number, number>>((acc, pipe) => {
      acc[pipe.id] = 0;
      return acc;
    }, {});

    productions.forEach((production) => {
      totals[production.pipe_type_id] =
        (totals[production.pipe_type_id] || 0) + Number(production.quantity || 0);
    });

    distributions.forEach((distribution) => {
      if (!distribution.remark || !distribution.remark.includes('is-resent')) {
        totals[distribution.pipe_type_id] =
          (totals[distribution.pipe_type_id] || 0) - Number(distribution.quantity || 0);
      }
    });

    returnsList.forEach((returnRecord) => {
      if (returnRecord.status !== 'damaged') {
        totals[returnRecord.pipe_type_id] =
          (totals[returnRecord.pipe_type_id] || 0) + Number(returnRecord.quantity || 0);
      }
    });

    return totals;
  }, [pipeTypes, productions, distributions, returnsList]);

  const villageBalanceMap = useMemo(() => {
    const balances: Record<string, Record<number, number>> = {};

    villages.forEach((village) => {
      balances[village.name] = {};
      pipeTypes.forEach((pipe) => {
        balances[village.name][pipe.id] = 0;
      });
    });

    distributions.forEach((distribution) => {
      const villageBalances = balances[distribution.village];
      if (villageBalances) {
        villageBalances[distribution.pipe_type_id] =
          (villageBalances[distribution.pipe_type_id] || 0) + Number(distribution.quantity || 0);
      }
    });

    returnsList.forEach((returnRecord) => {
      const villageBalances = balances[returnRecord.village];
      if (villageBalances) {
        villageBalances[returnRecord.pipe_type_id] =
          (villageBalances[returnRecord.pipe_type_id] || 0) - Number(returnRecord.quantity || 0);
      }
    });

    return balances;
  }, [pipeTypes, villages, distributions, returnsList]);

  const batchStockMap = useMemo(() => {
    const totals: Record<string, number> = {};

    productions.forEach((prod) => {
      if (prod.batch_id) {
        totals[prod.batch_id] = (totals[prod.batch_id] || 0) + Number(prod.quantity || 0);
      }
    });

    distributions.forEach((dist) => {
      if (dist.batch_id && (!dist.remark || !dist.remark.includes('is-resent'))) {
        totals[dist.batch_id] = (totals[dist.batch_id] || 0) - Number(dist.quantity || 0);
      }
    });

    returnsList.forEach((ret) => {
      if (ret.batch_id && ret.status !== 'damaged') {
        totals[ret.batch_id] = (totals[ret.batch_id] || 0) + Number(ret.quantity || 0);
      }
    });

    return totals;
  }, [productions, distributions, returnsList]);

  const batchStatusMap = useMemo(() => {
    const prodTotals: Record<string, number> = {};
    const distTotals: Record<string, number> = {};
    const retTotals: Record<string, number> = {};

    productions.forEach((p) => {
      if (p.batch_id) {
        prodTotals[p.batch_id] = (prodTotals[p.batch_id] || 0) + Number(p.quantity || 0);
      }
    });

    distributions.forEach((d) => {
      if (d.batch_id && (!d.remark || !d.remark.includes('is-resent'))) {
        distTotals[d.batch_id] = (distTotals[d.batch_id] || 0) + Number(d.quantity || 0);
      }
    });

    returnsList.forEach((r) => {
      if (r.batch_id && (!r.remark || !r.remark.includes('is-resent'))) {
        if (r.status === 'production_grade') {
          retTotals[r.batch_id] = (retTotals[r.batch_id] || 0) + Number(r.quantity || 0);
        }
      }
    });

    const status: Record<string, {
      produced: number;
      distributed: number;
      returned: number;
      isFullyReturned: boolean;
    }> = {};

    const allBatches = new Set([
      ...Object.keys(prodTotals),
      ...Object.keys(distTotals),
      ...Object.keys(retTotals),
    ]);

    allBatches.forEach((batchId) => {
      const produced = prodTotals[batchId] || 0;
      const distributed = distTotals[batchId] || 0;
      const returned = retTotals[batchId] || 0;
      const isFullyReturned = produced > 0 && returned >= produced;

      status[batchId] = {
        produced,
        distributed,
        returned,
        isFullyReturned,
      };
    });

    return status;
  }, [productions, distributions, returnsList]);

  const villageBatchBalanceMap = useMemo(() => {
    const balances: Record<string, Record<string, number>> = {};

    villages.forEach((village) => {
      balances[village.name] = {};
    });

    distributions.forEach((dist) => {
      if (dist.batch_id) {
        if (!balances[dist.village]) {
          balances[dist.village] = {};
        }
        balances[dist.village][dist.batch_id] =
          (balances[dist.village][dist.batch_id] || 0) + Number(dist.quantity || 0);
      }
    });

    returnsList.forEach((ret) => {
      if (ret.batch_id) {
        if (!balances[ret.village]) {
          balances[ret.village] = {};
        }
        balances[ret.village][ret.batch_id] =
          (balances[ret.village][ret.batch_id] || 0) - Number(ret.quantity || 0);
      }
    });

    return balances;
  }, [villages, distributions, returnsList]);

  const villageFundingSummaryMap = useMemo(() => {
    const summary: Record<string, { disbursements: number; repayments: number; balance: number }> = {};
    
    // Initialize for all villages
    villages.forEach((v) => {
      summary[v.name] = { disbursements: 0, repayments: 0, balance: 0 };
    });

    // Populate from fundingList
    fundingList.forEach((f) => {
      if (!summary[f.village]) {
        summary[f.village] = { disbursements: 0, repayments: 0, balance: 0 };
      }
      const amt = Number(f.amount || 0);
      if (f.type === 'disbursement') {
        summary[f.village].disbursements += amt;
      } else if (f.type === 'repayment') {
        summary[f.village].repayments += amt;
      }
    });

    // Calculate balance
    Object.keys(summary).forEach((vName) => {
      summary[vName].balance = summary[vName].disbursements - summary[vName].repayments;
    });

    return summary;
  }, [villages, fundingList]);

  const registeredBatchesList = useMemo(() => {
    const uniqueBatches = Array.from(new Set(productions.map(p => p.batch_id).filter(Boolean)));
    return uniqueBatches.map(batchId => {
      const firstProd = productions.find(p => p.batch_id === batchId);
      const pipeTypeId = firstProd?.pipe_type_id || 0;
      const pipeType = pipeTypes.find(pt => pt.id === pipeTypeId);
      const availableStock = batchStockMap[batchId!] || 0;
      return {
        batchId: batchId!,
        pipeTypeId,
        pipeName: pipeType?.name || 'Unknown Model',
        unitPrice: pipeType?.unit_price || 0,
        availableStock,
      };
    });
  }, [productions, pipeTypes, batchStockMap]);

  const viewingBatchDetails = useMemo(() => {
    if (!viewingBatchId) return null;

    const batchProductions = productions.filter(p => p.batch_id === viewingBatchId);
    const batchDistributions = distributions.filter(d => d.batch_id === viewingBatchId);
    const batchReturns = returnsList.filter(r => r.batch_id === viewingBatchId);

    let modelName = 'Unknown Model';
    let basePrice = 0;
    if (batchProductions.length > 0) {
      const pt = pipeTypes.find(p => p.id === batchProductions[0].pipe_type_id);
      if (pt) {
        modelName = pt.name;
        basePrice = pt.unit_price;
      }
    } else if (batchDistributions.length > 0) {
      const pt = pipeTypes.find(p => p.id === batchDistributions[0].pipe_type_id);
      if (pt) {
        modelName = pt.name;
        basePrice = pt.unit_price;
      }
    }

    const totalProduced = batchProductions.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalDistributed = batchDistributions
      .filter(d => !d.remark || !d.remark.includes('is-resent'))
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const totalReturnedDamaged = batchReturns
      .filter(r => r.status === 'damaged' && (!r.remark || !r.remark.includes('is-resent')))
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const totalReturnedProdGrade = batchReturns
      .filter(r => r.status === 'production_grade' && (!r.remark || !r.remark.includes('is-resent')))
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);

    return {
      batchId: viewingBatchId,
      modelName,
      basePrice,
      productions: batchProductions,
      distributions: batchDistributions,
      returns: batchReturns,
      summary: {
        produced: totalProduced,
        distributed: totalDistributed,
        returnedDamaged: totalReturnedDamaged,
        returnedProdGrade: totalReturnedProdGrade,
        remainingInOutposts: totalDistributed - (totalReturnedDamaged + totalReturnedProdGrade),
      }
    };
  }, [viewingBatchId, productions, distributions, returnsList, pipeTypes]);

  const deployedBatchesForSelectedVillage = useMemo(() => {
    const selectedVillage = returnForm.village;
    if (!selectedVillage) return [];
    
    const villageBalances = villageBatchBalanceMap[selectedVillage] || {};
    return Object.keys(villageBalances)
      .map(batchId => {
        const balance = villageBalances[batchId] || 0;
        let pipeTypeId = 0;
        const firstProd = productions.find(p => p.batch_id === batchId);
        if (firstProd) {
          pipeTypeId = firstProd.pipe_type_id;
        } else {
          const firstDist = distributions.find(d => d.batch_id === batchId);
          if (firstDist) {
            pipeTypeId = firstDist.pipe_type_id;
          }
        }
        const pipeType = pipeTypes.find(pt => pt.id === pipeTypeId);
        return {
          batchId,
          pipeTypeId,
          pipeName: pipeType?.name || 'Unknown Model',
          balance,
          unitPrice: pipeType?.unit_price || 0,
        };
      })
      .filter(b => b.balance > 0);
  }, [returnForm.village, villageBatchBalanceMap, productions, distributions, pipeTypes]);

  const deployedBatchesForEditVillage = useMemo(() => {
    const selectedVillage = editReturnForm.village;
    if (!selectedVillage) return [];
    
    const villageBalances = villageBatchBalanceMap[selectedVillage] || {};
    const list = Object.keys(villageBalances)
      .map(batchId => {
        const balance = villageBalances[batchId] || 0;
        let pipeTypeId = 0;
        const firstProd = productions.find(p => p.batch_id === batchId);
        if (firstProd) {
          pipeTypeId = firstProd.pipe_type_id;
        } else {
          const firstDist = distributions.find(d => d.batch_id === batchId);
          if (firstDist) {
            pipeTypeId = firstDist.pipe_type_id;
          }
        }
        const pipeType = pipeTypes.find(pt => pt.id === pipeTypeId);
        return {
          batchId,
          pipeTypeId,
          pipeName: pipeType?.name || 'Unknown Model',
          balance,
          unitPrice: pipeType?.unit_price || 0,
        };
      });
      
    if (editingReturn && editingReturn.village === selectedVillage && editingReturn.batch_id) {
      const exists = list.some(item => item.batchId === editingReturn.batch_id);
      if (!exists) {
        let pipeTypeId = editingReturn.pipe_type_id;
        const pipeType = pipeTypes.find(pt => pt.id === pipeTypeId);
        list.push({
          batchId: editingReturn.batch_id,
          pipeTypeId,
          pipeName: pipeType?.name || 'Unknown Model',
          balance: 0,
          unitPrice: pipeType?.unit_price || 0,
        });
      }
    }
    
    return list.filter(b => b.balance > 0 || (editingReturn && editingReturn.batch_id === b.batchId));
  }, [editReturnForm.village, villageBatchBalanceMap, productions, distributions, pipeTypes, editingReturn]);

  const availablePipeTypes = pipeTypes.filter((pipe) => (factoryStockMap[pipe.id] || 0) > 0);

  const selectedDistributionPrice = priceMap[distributionForm.pipeTypeId] || 0;
  const selectedReturnBalance = returnForm.batchId 
    ? (villageBatchBalanceMap[returnForm.village]?.[returnForm.batchId] || 0)
    : 0;

  const outstandingResentForSelected = useMemo(() => {
    if (!returnForm.village || !returnForm.batchId) return 0;
    const totalResentDist = distributions
      .filter(d => d.village === returnForm.village && d.batch_id === returnForm.batchId && d.remark && d.remark.includes('is-resent'))
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const totalResentRet = returnsList
      .filter(r => r.village === returnForm.village && r.batch_id === returnForm.batchId && r.remark && r.remark.includes('is-resent'))
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    return Math.max(0, totalResentDist - totalResentRet);
  }, [distributions, returnsList, returnForm.village, returnForm.batchId]);

  const hasResentItems = outstandingResentForSelected > 0;

  useEffect(() => {
    if (hasResentItems) {
      setReturnForm(prev => ({ ...prev, status: 'production_grade' }));
    }
  }, [hasResentItems]);

  const editReturnHasResent = useMemo(() => {
    if (!editReturnForm.village || !editReturnForm.batchId) return false;
    const isResentBeingEdited = editingReturn && editingReturn.remark && editingReturn.remark.includes('is-resent');
    if (isResentBeingEdited) return true;

    const totalResentDist = distributions
      .filter(d => d.village === editReturnForm.village && d.batch_id === editReturnForm.batchId && d.remark && d.remark.includes('is-resent'))
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const totalResentRet = returnsList
      .filter(r => r.village === editReturnForm.village && r.batch_id === editReturnForm.batchId && r.remark && r.remark.includes('is-resent'))
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    return Math.max(0, totalResentDist - totalResentRet) > 0;
  }, [distributions, returnsList, editReturnForm.village, editReturnForm.batchId, editingReturn]);

  useEffect(() => {
    if (editReturnHasResent && editReturnForm.status !== 'production_grade') {
      setEditReturnForm(prev => ({ ...prev, status: 'production_grade' }));
    }
  }, [editReturnHasResent, editReturnForm.status]);

  const outstandingDamagedReturns = useMemo(() => {
    return returnsList.filter(r => r.status === 'damaged' && (!r.remark || !r.remark.includes('is-resent')));
  }, [returnsList]);

  const totalStock = Object.values(factoryStockMap).reduce((sum, quantity) => sum + quantity, 0);
  const totalProduction = sumQuantity(productions);
  const totalDistributed = sumQuantity(distributions.filter(d => !d.remark || !d.remark.includes('is-resent')));
  const totalReturned = sumQuantity(returnsList.filter(r => r.status === 'production_grade'));
  const currentBalance = totalProduction - totalDistributed + totalReturned;
  const activeStockItems = availablePipeTypes.length;
  const activeVillages = new Set(distributions.map((item) => item.village)).size;

  const reconciliationLedger = useMemo(() => {
    const ledger: Array<{
      id: string;
      village: string;
      pipeName: string;
      batchId: string | null;
      distributedQty: number | string;
      distDate: string;
      returnedDamagedQty: number;
      returnedProductionGradeQty: number;
      returnDate: string;
      rebuyValue: number;
      leftQty: number;
      isResent?: boolean;
    }> = [];

    const getPipeNameForBatch = (bId: string | null, fallbackId?: number) => {
      if (bId) {
        const prod = productions.find(p => p.batch_id === bId);
        if (prod) {
          const pt = pipeTypes.find(pt => pt.id === prod.pipe_type_id);
          if (pt) return pt.name;
        }
      }
      if (fallbackId) {
        const pt = pipeTypes.find(pt => pt.id === fallbackId);
        if (pt) return pt.name;
      }
      return 'Unknown Model';
    };

    const villageBatches = new Set<string | null>();
    distributions.forEach(d => villageBatches.add(d.batch_id || null));
    returnsList.forEach(r => villageBatches.add(r.batch_id || null));
    const batchIds = Array.from(villageBatches);

    villages.forEach((v) => {
      batchIds.forEach((batchId) => {
        // Find all distributions of this batch to this village, sorted by date
        const dists = distributions
          .filter((d) => d.village === v.name && (d.batch_id || null) === batchId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Find all returns of this batch from this village, sorted by date
        const rets = returnsList
          .filter((r) => r.village === v.name && (r.batch_id || null) === batchId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (dists.length === 0 && rets.length === 0) return;

        let pipeName = 'Unknown Model';
        let fallbackPipeTypeId: number | undefined;
        if (dists.length > 0) {
          fallbackPipeTypeId = dists[0].pipe_type_id;
        } else if (rets.length > 0) {
          fallbackPipeTypeId = rets[0].pipe_type_id;
        }
        pipeName = getPipeNameForBatch(batchId, fallbackPipeTypeId);

        // Group returns by the closest distribution (distribution date <= return date)
        const distReturnMap = new Map<number, typeof rets>();
        const orphanReturns: typeof rets = [];

        rets.forEach((r) => {
          // Find the latest distribution that occurred on or before this return
          const matchedDist = [...dists]
            .reverse()
            .find((d) => new Date(d.date).getTime() <= new Date(r.date).getTime());

          if (matchedDist) {
            const list = distReturnMap.get(matchedDist.id) || [];
            list.push(r);
            distReturnMap.set(matchedDist.id, list);
          } else {
            orphanReturns.push(r);
          }
        });

        // For each distribution, output row(s)
        dists.forEach((d) => {
          const isResentDist = !!(d.remark && d.remark.includes('is-resent'));
          const matchedRets = distReturnMap.get(d.id) || [];
          if (matchedRets.length > 0) {
            // Group matched returns by date
            const groupedByDate: Record<string, {
              date: string;
              damagedQty: number;
              prodGradeQty: number;
              rebuyValue: number;
            }> = {};

            matchedRets.forEach((r) => {
              const dateKey = r.date;
              if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = {
                  date: r.date,
                  damagedQty: 0,
                  prodGradeQty: 0,
                  rebuyValue: 0,
                };
              }
              const group = groupedByDate[dateKey];
              if (r.status === 'damaged') {
                group.damagedQty += Number(r.quantity || 0);
              } else {
                group.prodGradeQty += Number(r.quantity || 0);
                group.rebuyValue += Number(r.quantity || 0) * (r.price || 0);
              }
            });

            // Sort grouped dates chronologically
            const sortedGrouped = Object.values(groupedByDate).sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            let runningReturned = 0;
            sortedGrouped.forEach((group, idx) => {
              // Both production grade and damaged returns reduce the outstanding village balance
              runningReturned += group.prodGradeQty + group.damagedQty;
              const leftQty = Math.max(0, Number(d.quantity) - runningReturned);

              ledger.push({
                id: `${v.id}-${batchId || 'null'}-d${d.id}-g${group.date}-${idx}`,
                village: v.name,
                pipeName,
                batchId,
                distributedQty: d.quantity,
                distDate: d.date,
                returnedDamagedQty: group.damagedQty,
                returnedProductionGradeQty: group.prodGradeQty,
                returnDate: group.date,
                rebuyValue: group.rebuyValue,
                leftQty,
                isResent: isResentDist,
              });
            });
          } else {
            // Distribution with no returns
            ledger.push({
              id: `${v.id}-${batchId || 'null'}-d${d.id}-none`,
              village: v.name,
              pipeName,
              batchId,
              distributedQty: d.quantity,
              distDate: d.date,
              returnedDamagedQty: 0,
              returnedProductionGradeQty: 0,
              returnDate: 'N/A',
              rebuyValue: 0,
              leftQty: Number(d.quantity),
              isResent: isResentDist,
            });
          }
        });

        // For orphan returns (returns without matching distributions)
        // Group orphan returns by date
        const groupedOrphans: Record<string, {
          date: string;
          damagedQty: number;
          prodGradeQty: number;
          rebuyValue: number;
        }> = {};

        orphanReturns.forEach((r) => {
          const dateKey = r.date;
          if (!groupedOrphans[dateKey]) {
            groupedOrphans[dateKey] = {
              date: r.date,
              damagedQty: 0,
              prodGradeQty: 0,
              rebuyValue: 0,
            };
          }
          const group = groupedOrphans[dateKey];
          if (r.status === 'damaged') {
            group.damagedQty += Number(r.quantity || 0);
          } else {
            group.prodGradeQty += Number(r.quantity || 0);
            group.rebuyValue += Number(r.quantity || 0) * (r.price || 0);
          }
        });

        Object.values(groupedOrphans)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .forEach((group, idx) => {
            ledger.push({
              id: `${v.id}-${batchId || 'null'}-orphan-g${group.date}-${idx}`,
              village: v.name,
              pipeName,
              batchId,
              distributedQty: 0,
              distDate: 'N/A',
              returnedDamagedQty: group.damagedQty,
              returnedProductionGradeQty: group.prodGradeQty,
              returnDate: group.date,
              rebuyValue: group.rebuyValue,
              leftQty: 0,
              isResent: false,
            });
          });
      });
    });

    return ledger;
  }, [villages, pipeTypes, distributions, returnsList, productions]);

  const filteredReconciliation = useMemo(() => {
    return reconciliationLedger.filter((item) => {
      const matchVillage = filterVillage === 'All' || item.village === filterVillage;
      const matchBatchId = filterBatchId === 'All' || item.batchId === filterBatchId;
      const matchType = filterReconType === 'All'
        || (filterReconType === 'Distributions' && Number(item.distributedQty) > 0)
        || (filterReconType === 'Returns' && (Number(item.returnedDamagedQty) > 0 || Number(item.returnedProductionGradeQty) > 0));
      
      let matchDate = true;
      if (isSpecificDate) {
        matchDate = !filterStartDate ||
          (item.distDate !== 'N/A' && item.distDate === filterStartDate) ||
          (item.returnDate !== 'N/A' && item.returnDate === filterStartDate);
      } else {
        const matchStart = !filterStartDate ||
          (item.distDate !== 'N/A' && new Date(item.distDate) >= new Date(filterStartDate)) ||
          (item.returnDate !== 'N/A' && new Date(item.returnDate) >= new Date(filterStartDate));
        const matchEnd = !filterEndDate ||
          (item.distDate !== 'N/A' && new Date(item.distDate) <= new Date(filterEndDate)) ||
          (item.returnDate !== 'N/A' && new Date(item.returnDate) <= new Date(filterEndDate));
        matchDate = matchStart && matchEnd;
      }
      
      const query = searchReconciliationQuery.toLowerCase();
      const matchSearch = !query ||
        item.village.toLowerCase().includes(query) ||
        (item.batchId || '').toLowerCase().includes(query) ||
        (item.pipeName || '').toLowerCase().includes(query) ||
        (item.distDate || '').toLowerCase().includes(query) ||
        (item.returnDate || '').toLowerCase().includes(query);

      return matchVillage && matchBatchId && matchType && matchDate && matchSearch;
    });
  }, [reconciliationLedger, filterVillage, filterBatchId, filterReconType, filterStartDate, filterEndDate, isSpecificDate, searchReconciliationQuery]);

  // --- Charts Data Selectors ---
  const mostDamagedVillageData = useMemo(() => {
    const groups: Record<string, { village: string; batchId: string; pipeTypeId: number; quantity: number }> = {};
    returnsList.forEach((r) => {
      if (r.status !== 'damaged') return;
      const batchId = r.batch_id || 'Unknown';
      const pipeTypeId = r.pipe_type_id;
      const village = r.village;
      const key = `${village}_${batchId}_${pipeTypeId}`;
      if (!groups[key]) {
        groups[key] = { village, batchId, pipeTypeId, quantity: 0 };
      }
      groups[key].quantity += Number(r.quantity || 0);
    });
    return Object.values(groups)
      .sort((a, b) => b.quantity - a.quantity);
  }, [returnsList]);

  const leftToReturnByBatchData = useMemo(() => {
    const groups: Record<string, { batchId: string; pipeTypeId: number; distributed: number; returned: number; balance: number }> = {};
    distributions.forEach((d) => {
      if (d.remark && d.remark.includes('is-resent')) return;
      const batchId = d.batch_id || 'Unknown';
      const pipeTypeId = d.pipe_type_id;
      const key = `${batchId}_${pipeTypeId}`;
      if (!groups[key]) {
        groups[key] = { batchId, pipeTypeId, distributed: 0, returned: 0, balance: 0 };
      }
      groups[key].distributed += Number(d.quantity || 0);
    });
    returnsList.forEach((r) => {
      if (r.remark && r.remark.includes('is-resent')) return;
      const batchId = r.batch_id || 'Unknown';
      const pipeTypeId = r.pipe_type_id;
      const key = `${batchId}_${pipeTypeId}`;
      if (!groups[key]) {
        groups[key] = { batchId, pipeTypeId, distributed: 0, returned: 0, balance: 0 };
      }
      groups[key].returned += Number(r.quantity || 0);
    });
    return Object.values(groups)
      .map((g) => ({
        ...g,
        balance: Math.max(0, g.distributed - g.returned),
      }))
      .filter((g) => g.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [distributions, returnsList]);

  const villageDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    villages.forEach((v) => { counts[v.name] = 0; });
    distributions.forEach((d) => {
      if (d.remark && d.remark.includes('is-resent')) return;
      counts[d.village] = (counts[d.village] || 0) + Number(d.quantity || 0);
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .filter((item) => item.qty > 0)
      .sort((a, b) => b.qty - a.qty);
  }, [villages, distributions]);

  const pipeTypeUsageData = useMemo(() => {
    const counts: Record<number, number> = {};
    pipeTypes.forEach((p) => { counts[p.id] = 0; });
    distributions.forEach((d) => {
      if (d.remark && d.remark.includes('is-resent')) return;
      counts[d.pipe_type_id] = (counts[d.pipe_type_id] || 0) + Number(d.quantity || 0);
    });
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    return pipeTypes
      .map((p) => ({
        name: p.name,
        qty: counts[p.id] || 0,
        percentage: total > 0 ? Math.round(((counts[p.id] || 0) / total) * 100) : 0,
      }))
      .filter((item) => item.qty > 0)
      .sort((a, b) => b.qty - a.qty);
  }, [pipeTypes, distributions]);

  const returnsOverTimeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    returnsList.forEach((r) => {
      if (r.remark && r.remark.includes('is-resent')) return;
      grouped[r.date] = (grouped[r.date] || 0) + Number(r.quantity || 0);
    });
    return Object.entries(grouped)
      .map(([date, qty]) => ({ date, qty }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8); // Show last 8 active days
  }, [returnsList]);

  const damagedVsProductionGradeData = useMemo(() => {
    let productionGrade = 0;
    let damaged = 0;
    returnsList.forEach((r) => {
      if (r.status === 'damaged') {
        damaged += Number(r.quantity || 0);
      } else {
        productionGrade += Number(r.quantity || 0);
      }
    });
    const total = productionGrade + damaged;
    return [
      { name: language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'Production Grade', qty: productionGrade, percentage: total > 0 ? Math.round((productionGrade / total) * 100) : 0, color: 'var(--success)' },
      { name: language === 'my' ? 'ပျက်စီး' : 'Damaged', qty: damaged, percentage: total > 0 ? Math.round((damaged / total) * 100) : 0, color: 'var(--danger)' }
    ];
  }, [returnsList, language]);

  const activityTrendData = useMemo(() => {
    const datesSet = new Set<string>();
    productions.forEach(p => datesSet.add(p.date));
    distributions.forEach(d => {
      if (!d.remark || !d.remark.includes('is-resent')) {
        datesSet.add(d.date);
      }
    });
    returnsList.forEach(r => {
      if (r.status === 'production_grade') {
        datesSet.add(r.date);
      }
    });
    const sortedDates = Array.from(datesSet).sort().slice(-8);
    return sortedDates.map((dateStr) => {
      const prodQty = productions.filter(p => p.date === dateStr).reduce((s, p) => s + Number(p.quantity || 0), 0);
      const distQty = distributions.filter(d => d.date === dateStr && (!d.remark || !d.remark.includes('is-resent'))).reduce((s, d) => s + Number(d.quantity || 0), 0);
      const retQty = returnsList.filter(r => r.date === dateStr && r.status === 'production_grade').reduce((s, r) => s + Number(r.quantity || 0), 0);
      return {
        date: dateStr,
        production: prodQty,
        distribution: distQty,
        returns: retQty,
      };
    });
  }, [productions, distributions, returnsList]);

  // --- Reports Calculation Selector ---
  const reportFilteredRecon = useMemo(() => {
    if (reportType !== 'distribution_left') return [];
    return reconciliationLedger.filter((item) => {
      const matchVillage = reportVillage === 'All' || item.village === reportVillage;
      const matchBatch = reportBatchId === 'All' || item.batchId === reportBatchId;
      const pipeTypeObj = pipeTypes.find(pt => pt.name === item.pipeName);
      const matchPipe = reportPipeTypeId === 'All' || (pipeTypeObj && pipeTypeObj.id === Number(reportPipeTypeId));
      
      let matchDate = true;
      if (isSpecificDate) {
        matchDate = !filterStartDate || (item.distDate !== 'N/A' && item.distDate === filterStartDate);
      } else {
        const matchStart = !filterStartDate || (item.distDate !== 'N/A' && item.distDate >= filterStartDate);
        const matchEnd = !filterEndDate || (item.distDate !== 'N/A' && item.distDate <= filterEndDate);
        matchDate = matchStart && matchEnd;
      }

      return matchVillage && matchBatch && matchPipe && matchDate;
    });
  }, [reportType, reconciliationLedger, reportVillage, reportBatchId, reportPipeTypeId, filterStartDate, filterEndDate, isSpecificDate, pipeTypes]);

  const reportFilterRange = useMemo(() => {
    if (reportType === 'distribution_left') {
      const villageLabel = reportVillage === 'All' ? (language === 'my' ? 'ကျေးရွာအားလုံး' : 'All Villages') : reportVillage;
      const modelLabel = reportPipeTypeId === 'All' 
        ? (language === 'my' ? 'မော်ဒယ်အားလုံး' : 'All Models') 
        : (pipeTypes.find(p => p.id === Number(reportPipeTypeId))?.name || 'Unknown');
      const batchLabel = reportBatchId === 'All' ? (language === 'my' ? 'အသုတ်အားလုံး' : 'All Batches') : reportBatchId;
      
      if (isSpecificDate) {
        const dateLabel = filterStartDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
        return {
          start: filterStartDate,
          end: filterStartDate,
          label: `${language === 'my' ? 'ကျေးရွာ' : 'Village'}: ${villageLabel} | ${language === 'my' ? 'မော်ဒယ်' : 'Model'}: ${modelLabel} | Batch: ${batchLabel} | ${language === 'my' ? 'ရက်စွဲ' : 'Date'}: ${dateLabel}`,
        };
      }

      const startStr = filterStartDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
      const endStr = filterEndDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
      
      return {
        start: filterStartDate,
        end: filterEndDate,
        label: `${language === 'my' ? 'ကျေးရွာ' : 'Village'}: ${villageLabel} | ${language === 'my' ? 'မော်ဒယ်' : 'Model'}: ${modelLabel} | Batch: ${batchLabel} | ${language === 'my' ? 'ကာလ' : 'Period'}: ${startStr} ${language === 'my' ? 'မှ' : 'to'} ${endStr}`,
      };
    }
    if (filterBatchId !== 'All') {
      return {
        start: '',
        end: '',
        label: `${t.batchReportLabel} ${filterBatchId}`,
      };
    }
    if (reportType === 'custom') {
      if (isSpecificDate) {
        const dateLabel = filterStartDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
        return {
          start: filterStartDate,
          end: filterStartDate,
          label: dateLabel,
        };
      }
      const startStr = filterStartDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
      const endStr = filterEndDate || (language === 'my' ? 'မည်သည့်ရက်စွဲမဆို' : 'Any Date');
      return {
        start: filterStartDate,
        end: filterEndDate,
        label: `${startStr} ${language === 'my' ? 'မှ' : 'to'} ${endStr}`,
      };
    }
    if (!reportDate) return { start: '', end: '', label: '' };
    const date = new Date(reportDate);
    if (reportType === 'daily') {
      return {
        start: reportDate,
        end: reportDate,
        label: reportDate,
      };
    } else if (reportType === 'weekly') {
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      const endStr = end.toISOString().slice(0, 10);
      return {
        start: reportDate,
        end: endStr,
        label: `${reportDate} to ${endStr}`,
      };
    } else {
      const yearMonth = reportDate.slice(0, 7);
      return {
        start: `${yearMonth}-01`,
        end: `${yearMonth}-31`,
        label: yearMonth,
      };
    }
  }, [reportType, reportDate, filterBatchId, language, t.batchReportLabel, reportVillage, reportPipeTypeId, reportBatchId, pipeTypes, filterStartDate, filterEndDate, isSpecificDate]);

  const reportData = useMemo(() => {
    if (reportType === 'distribution_left') {
      let distributed = 0;
      let returned = 0;
      const countedDistIds = new Set<string>();
      
      reportFilteredRecon.forEach((item) => {
        const distKey = item.id.split('-r')[0].split('-none')[0];
        if (!countedDistIds.has(distKey)) {
          countedDistIds.add(distKey);
          if (!item.isResent) {
            distributed += Number(item.distributedQty || 0);
          }
        }
        returned += Number(item.returnedProductionGradeQty || 0);
      });
      
      return {
        productions: [],
        distributions: [],
        returns: [],
        totals: {
          produced: 0,
          distributed,
          returned,
          balance: Math.max(0, distributed - returned),
        }
      };
    }

    let filteredProds = [];
    let filteredDists = [];
    let filteredRets = [];

    if (filterBatchId !== 'All') {
      filteredProds = productions.filter(p => p.batch_id === filterBatchId);
      filteredDists = distributions.filter(d => d.batch_id === filterBatchId);
      filteredRets = returnsList.filter(r => r.batch_id === filterBatchId);
    } else {
      const { start, end } = reportFilterRange;
      if (reportType === 'custom') {
        filteredProds = productions.filter(p => {
          if (start && p.date < start) return false;
          if (end && p.date > end) return false;
          return true;
        });
        filteredDists = distributions.filter(d => {
          if (start && d.date < start) return false;
          if (end && d.date > end) return false;
          return true;
        });
        filteredRets = returnsList.filter(r => {
          if (start && r.date < start) return false;
          if (end && r.date > end) return false;
          return true;
        });
      } else {
        if (!start) return { productions: [], distributions: [], returns: [], totals: { produced: 0, distributed: 0, returned: 0, balance: 0 } };

        if (reportType === 'daily') {
          filteredProds = productions.filter(p => p.date === start);
          filteredDists = distributions.filter(d => d.date === start);
          filteredRets = returnsList.filter(r => r.date === start);
        } else if (reportType === 'weekly') {
          filteredProds = productions.filter(p => p.date >= start && p.date <= end);
          filteredDists = distributions.filter(d => d.date >= start && d.date <= end);
          filteredRets = returnsList.filter(r => r.date >= start && r.date <= end);
        } else {
          const yearMonth = start.slice(0, 7);
          filteredProds = productions.filter(p => p.date.startsWith(yearMonth));
          filteredDists = distributions.filter(d => d.date.startsWith(yearMonth));
          filteredRets = returnsList.filter(r => r.date.startsWith(yearMonth));
        }
      }
    }

    const produced = sumQuantity(filteredProds);
    const distributed = sumQuantity(filteredDists.filter(d => !d.remark || !d.remark.includes('is-resent')));
    const returned = sumQuantity(filteredRets.filter(r => r.status === 'production_grade'));

    return {
      productions: filteredProds,
      distributions: filteredDists,
      returns: filteredRets,
      totals: {
        produced,
        distributed,
        returned,
        balance: produced - distributed + returned,
      }
    };
  }, [reportType, reportFilterRange, productions, distributions, returnsList, filterBatchId, reportFilteredRecon]);

  // --- SVG Charting Components ---
  const VillageDistBarChart = () => {
    const width = 500;
    const height = 300;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (villageDistData.length === 0) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {language === 'my' ? 'ဖြန့်ဖြူးမှုမှတ်တမ်း မရှိသေးပါ' : 'No distribution records logged yet'}
        </div>
      );
    }

    const maxQty = Math.max(...villageDistData.map((d) => d.qty), 1);

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={1} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-color)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontWeight="500">
                {Math.round(maxQty * ratio)}
              </text>
            </g>
          );
        })}
        {villageDistData.map((item, idx) => {
          const barWidth = Math.max(15, chartWidth / villageDistData.length - 12);
          const x = padding.left + idx * (chartWidth / villageDistData.length) + (chartWidth / villageDistData.length - barWidth) / 2;
          const barHeight = (item.qty / maxQty) * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGrad)"
                rx="4"
                style={{ cursor: 'pointer' }}
              >
                <title>{`${item.name}: ${item.qty} units`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-secondary)"
                transform={`rotate(-15, ${x + barWidth / 2}, ${height - padding.bottom + 16})`}
                fontWeight="500"
              >
                {item.name.length > 8 ? `${item.name.slice(0, 7)}...` : item.name}
              </text>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">
                {item.qty}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const PipeTypeDoughnutChart = () => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const thickness = 28;

    if (isDataLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', width: '100%' }}>
          <div className="skeleton-box" style={{ height: '220px', width: '220px', borderRadius: '50%' }} />
        </div>
      );
    }

    if (pipeTypeUsageData.length === 0) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {language === 'my' ? 'မော်ဒယ်အသုံးပြုမှုမှတ်တမ်း မရှိသေးပါ' : 'No pipe models usage logged yet'}
        </div>
      );
    }

    const colors = [
      '#4f46e5',
      '#0d9488',
      '#7c3aed',
      '#ea580c',
      '#db2777',
      '#2563eb',
      '#16a34a',
    ];

    let accumulatedAngle = 0;
    const totalUsage = pipeTypeUsageData.reduce((s, d) => s + d.qty, 0);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {pipeTypeUsageData.map((item, idx) => {
            const percentage = item.percentage;
            if (percentage === 0) return null;

            if (percentage >= 99) {
              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius - thickness / 2}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={thickness}
                >
                  <title>{`${item.name}: ${item.qty} units (100%)`}</title>
                </circle>
              );
            }

            const angle = (percentage / 100) * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle += angle;

            const rad = Math.PI / 180;
            const x1 = center + radius * Math.cos(startAngle * rad);
            const y1 = center + radius * Math.sin(startAngle * rad);
            const x2 = center + radius * Math.cos(endAngle * rad);
            const y2 = center + radius * Math.sin(endAngle * rad);

            const innerRadius = radius - thickness;
            const ix1 = center + innerRadius * Math.cos(endAngle * rad);
            const iy1 = center + innerRadius * Math.sin(endAngle * rad);
            const ix2 = center + innerRadius * Math.cos(startAngle * rad);
            const iy2 = center + innerRadius * Math.sin(startAngle * rad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${ix1} ${iy1}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
              'Z'
            ].join(' ');

            return (
              <path
                key={idx}
                d={pathData}
                fill={colors[idx % colors.length]}
                stroke="var(--bg-primary)"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${item.name}: ${item.qty} units (${percentage}%)`}</title>
              </path>
            );
          })}
          <circle cx={center} cy={center} r={radius - thickness} fill="var(--bg-primary)" />
          <text x={center} y={center - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="600" letterSpacing="0.05em">
            {language === 'my' ? 'စုစုပေါင်းသုံးစွဲမှု' : 'TOTAL USAGE'}
          </text>
          <text x={center} y={center + 14} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">
            {totalUsage}
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
          {pipeTypeUsageData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: colors[idx % colors.length] }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.qty} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReturnsOverTimeLineChart = () => {
    const width = 500;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (returnsOverTimeData.length === 0) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {language === 'my' ? 'အပ်နှံမှုမှတ်တမ်း မရှိသေးပါ' : 'No return logs recorded yet'}
        </div>
      );
    }

    const maxQty = Math.max(...returnsOverTimeData.map((d) => d.qty), 1);

    const points = returnsOverTimeData.map((item, idx) => {
      const x = padding.left + (idx / Math.max(1, returnsOverTimeData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (item.qty / maxQty) * chartHeight;
      return { x, y, ...item };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z` : '';

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-color)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontWeight="500">
                {Math.round(maxQty * ratio)}
              </text>
            </g>
          );
        })}
        {points.length > 0 && <path d={areaD} fill="url(#areaGrad)" />}
        {points.length > 0 && <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="var(--accent)" stroke="var(--bg-primary)" strokeWidth={2} style={{ cursor: 'pointer' }} />
            <title>{`${p.date}: ${p.qty} units`}</title>
            <text x={p.x} y={height - padding.bottom + 16} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="500">
              {p.date.slice(5)}
            </text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-primary)">
              {p.qty}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const DamagedVsProductionGradeChart = () => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const thickness = 28;

    const total = damagedVsProductionGradeData.reduce((s, d) => s + d.qty, 0);

    if (total === 0) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {language === 'my' ? 'ချို့ယွင်းချက်နှင့် ပြန်အပ်မှုမှတ်တမ်း မရှိသေးပါ' : 'No returns for ratio analysis yet'}
        </div>
      );
    }

    let accumulatedAngle = 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {damagedVsProductionGradeData.map((item, idx) => {
            const percentage = item.percentage;
            if (percentage === 0) return null;

            if (percentage >= 99) {
              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius - thickness / 2}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={thickness}
                >
                  <title>{`${item.name}: ${item.qty} units (100%)`}</title>
                </circle>
              );
            }

            const angle = (percentage / 100) * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle += angle;

            const rad = Math.PI / 180;
            const x1 = center + radius * Math.cos(startAngle * rad);
            const y1 = center + radius * Math.sin(startAngle * rad);
            const x2 = center + radius * Math.cos(endAngle * rad);
            const y2 = center + radius * Math.sin(endAngle * rad);

            const innerRadius = radius - thickness;
            const ix1 = center + innerRadius * Math.cos(endAngle * rad);
            const iy1 = center + innerRadius * Math.sin(endAngle * rad);
            const ix2 = center + innerRadius * Math.cos(startAngle * rad);
            const iy2 = center + innerRadius * Math.sin(startAngle * rad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${ix1} ${iy1}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
              'Z'
            ].join(' ');

            return (
              <path
                key={idx}
                d={pathData}
                fill={item.color}
                stroke="var(--bg-primary)"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${item.name}: ${item.qty} units (${percentage}%)`}</title>
              </path>
            );
          })}
          <circle cx={center} cy={center} r={radius - thickness} fill="var(--bg-primary)" />
          <text x={center} y={center - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="600" letterSpacing="0.05em">
            {language === 'my' ? 'စုစုပေါင်းအပ်နှံမှု' : 'TOTAL RETURNS'}
          </text>
          <text x={center} y={center + 14} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">
            {total}
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
          {damagedVsProductionGradeData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.qty} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ActivityTrendLineChart = () => {
    const width = 500;
    const height = 300;
    const padding = { top: 40, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (activityTrendData.length === 0) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {language === 'my' ? 'လုပ်ဆောင်မှုမရှိသေးပါ' : 'No activity logged yet'}
        </div>
      );
    }

    const maxVal = Math.max(
      ...activityTrendData.map((d) => Math.max(d.production, d.distribution, d.returns)),
      1
    );

    const getPoints = (key: 'production' | 'distribution' | 'returns') => {
      return activityTrendData.map((item, idx) => {
        const x = padding.left + (idx / Math.max(1, activityTrendData.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (item[key] / maxVal) * chartHeight;
        return { x, y, val: item[key] };
      });
    };

    const prodPoints = getPoints('production');
    const distPoints = getPoints('distribution');
    const retPoints = getPoints('returns');

    const getPath = (points: typeof prodPoints) => {
      return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-color)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontWeight="500">
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          );
        })}
        {prodPoints.length > 0 && <path d={getPath(prodPoints)} fill="none" stroke="#ea580c" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {distPoints.length > 0 && <path d={getPath(distPoints)} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {retPoints.length > 0 && <path d={getPath(retPoints)} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

        {activityTrendData.map((item, idx) => {
          const x = padding.left + (idx / Math.max(1, activityTrendData.length - 1)) * chartWidth;
          return (
            <text key={idx} x={x} y={height - padding.bottom + 16} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="500">
              {item.date.slice(5)}
            </text>
          );
        })}

        <g transform={`translate(${padding.left + 20}, 20)`} fontSize="10" fontWeight="600" fill="var(--text-secondary)">
          <circle cx={10} cy={0} r={4.5} fill="#ea580c" />
          <text x={20} y={3}>{language === 'my' ? 'ထုတ်လုပ်မှု' : 'Production'}</text>
          <circle cx={110} cy={0} r={4.5} fill="#4f46e5" />
          <text x={120} y={3}>{language === 'my' ? 'ဖြန့်ဖြူးမှု' : 'Distribution'}</text>
          <circle cx={210} cy={0} r={4.5} fill="#7c3aed" />
          <text x={220} y={3}>{language === 'my' ? 'ပြန်လည်အပ်နှံမှု' : 'Returns'}</text>
        </g>
      </svg>
    );
  };

  // --- Reports Export Handlers ---
  const handleExportExcel = () => {
    const t = TRANSLATIONS[language];
    const { label } = reportFilterRange;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    if (reportType === 'distribution_left') {
      // 1. Create Summary Sheet Data
      const summaryData = [
        ["TrammelNet - Outpost Distribution & Left Return Report"],
        ["Filters", label],
        ["Generated On", new Date().toLocaleString()],
        [],
        ["Summary Metrics"],
        [language === 'my' ? 'စုစုပေါင်း ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Total Distributed Units', reportData.totals.distributed],
        [language === 'my' ? 'စုစုပေါင်း ပြန်အပ်နှံပြီး အရေအတွက်' : 'Total Returned Units', reportData.totals.returned],
        [language === 'my' ? 'ပြန်အပ်ရန် ကျန်ရှိသော အရေအတွက်' : 'Left to Return to Company', reportData.totals.balance]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      // 2. Create Details Sheet Data
      const detailsHeaders = [
        language === 'my' ? "ကျေးရွာ" : "Village Outpost",
        t.pipeModel,
        "Batch ID",
        language === 'my' ? "ဖြန့်ဖြူးသည့်ရက်စွဲ" : "Dist Date",
        language === 'my' ? "ဖြန့်ဖြူးပြီး အရေအတွက်" : "Distributed Qty (Units)",
        language === 'my' ? "ချို့ယွင်းချက် (Error)" : "Returned Damaged (Units)",
        language === 'my' ? "ထုတ်လုပ်မှု အဆင့်မီ" : "Production Grade (Units)",
        language === 'my' ? "ကျန်ရှိသော အရေအတွက်" : "Left Qty (Units)",
        language === 'my' ? "ပြန်အပ်သည့်ရက်စွဲ" : "Return Date"
      ];

      const detailsRows = reportFilteredRecon.map((item: any) => [
        item.village,
        item.pipeName,
        item.batchId || 'N/A',
        item.distDate,
        item.distributedQty,
        item.returnedDamagedQty,
        item.returnedProductionGradeQty || 0,
        item.leftQty,
        item.returnDate || 'N/A'
      ]);

      const wsDetails = XLSX.utils.aoa_to_sheet([detailsHeaders, ...detailsRows]);
      XLSX.utils.book_append_sheet(wb, wsDetails, "Details");

      // Save the workbook
      XLSX.writeFile(wb, `distribution_left_report_${getLocalTodayDateString()}.xlsx`);
      return;
    }

    // For Daily / Weekly / Monthly reports
    if (!reportDate && filterBatchId === 'All') {
      alert(language === 'my' ? 'အစီရင်ခံစာ ကာလ ရွေးချယ်ပေးပါ' : 'Please select a report date/period first.');
      return;
    }

    // 1. Create Overview Sheet
    const overviewData = [
      ["TrammelNet Centralized Inventory Report"],
      ["Period", label],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["Summary Metrics"],
      [t.totalProducedUnits, reportData.totals.produced],
      [t.totalDistributedUnits, reportData.totals.distributed],
      [t.totalReturnedUnits, reportData.totals.returned],
      [t.netInventoryChange, reportData.totals.balance]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

    // 2. Create Productions Sheet
    if (reportData.productions.length > 0) {
      const prodHeaders = ["Date", "Batch ID", "Pipe Model", "Quantity (Units)", "Unit Price (MMK)", "Total Price (MMK)"];
      const prodRows = reportData.productions.map((p: any) => {
        const pipe = pipeTypes.find((pt) => pt.id === p.pipe_type_id);
        const pipeName = pipe?.name || 'Unknown';
        const unitPrice = pipe?.unit_price || 0;
        const totalPrice = p.quantity * unitPrice;
        return [p.date, p.batch_id || 'N/A', pipeName, p.quantity, unitPrice, totalPrice];
      });
      const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
      XLSX.utils.book_append_sheet(wb, wsProd, "Productions");
    }

    // 3. Create Distributions Sheet
    if (reportData.distributions.length > 0) {
      const distHeaders = ["Date", "Outpost Node", "Pipe Model", "Batch ID", "Quantity (Units)", "Unit Price (MMK)", "Total Price (MMK)", "Remarks"];
      const distRows = reportData.distributions.map((d: any) => {
        const pipeName = pipeTypes.find((pt) => pt.id === d.pipe_type_id)?.name || 'Unknown';
        return [d.date, d.village, pipeName, d.batch_id || 'N/A', d.quantity, d.price, d.quantity * d.price, d.remark || ''];
      });
      const wsDist = XLSX.utils.aoa_to_sheet([distHeaders, ...distRows]);
      XLSX.utils.book_append_sheet(wb, wsDist, "Distributions");
    }

    // 4. Create Returns Sheet
    if (reportData.returns.length > 0) {
      const retHeaders = ["Date", "Outpost Node", "Pipe Model", "Batch ID", "Quantity (Units)", "Classification"];
      const retRows = reportData.returns.map((r: any) => {
        const pipeName = pipeTypes.find((pt) => pt.id === r.pipe_type_id)?.name || 'Unknown';
        return [r.date, r.village, pipeName, r.batch_id || 'N/A', r.quantity, r.status === 'damaged' ? 'DAMAGED' : 'PRODUCTION GRADE'];
      });
      const wsRet = XLSX.utils.aoa_to_sheet([retHeaders, ...retRows]);
      XLSX.utils.book_append_sheet(wb, wsRet, "Returns");
    }

    // Save the workbook
    const downloadName = filterBatchId !== 'All' 
      ? `inventory_report_batch_${filterBatchId}.xlsx`
      : `inventory_report_${reportType}_${label.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, downloadName);
  };

  const handleExportPdf = () => {
    if (reportType !== 'distribution_left' && !reportDate && filterBatchId === 'All') {
      alert(language === 'my' ? 'အစီရင်ခံစာ ကာလ ရွေးချယ်ပေးပါ' : 'Please select a report date/period first.');
      return;
    }
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleExportBatchPdf = () => {
    document.body.classList.add('printing-batch-details');
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      document.body.classList.remove('printing-batch-details');
    }, 150);
  };

  const handleLogFundingTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingForm.date || !fundingForm.village || !fundingForm.type || !fundingForm.amount) {
      alert(language === 'my' ? 'အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်စွက်ပါ' : 'Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/village-funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fundingForm),
      });
      const data = await response.json();
      if (response.ok) {
        setFundingForm({
          date: getLocalTodayDateString(),
          village: villages.length > 0 ? villages[0].name : '',
          type: 'disbursement',
          amount: 0,
          remark: '',
        });
        // Reload data
        await loadData();
      } else {
        alert(data.error || 'Failed to log funding transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFundingRecord = async (id: number) => {
    if (!confirm(language === 'my' ? 'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?' : 'Are you sure you want to delete this cash transaction record?')) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/village-funding?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        await loadData();
      } else {
        alert(data.error || 'Failed to delete record.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to authenticate.');
      } else {
        localStorage.setItem('pf_logged_in', 'true');
        setUser(data.user);
        setLoginPassword('');
      }
    } catch (err) {
      setMessage('Server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to create admin.');
      } else {
        setMessage('Admin account registered successfully! You can now sign in.');
        setIsRegistering(false);
        setLoginPassword('');
      }
    } catch (err) {
      setMessage('Server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    localStorage.removeItem('pf_logged_in');
    setUser(null);
    setActiveTab('Overview');
    setIsSidebarOpen(false);
    router.push('?tab=Overview');
  };

  // --- Submit Handlers ---
  const submitForm = async (url: string, body: object, reset?: () => void) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to save the record.');
      } else {
        setMessage(language === 'my' ? 'မှတ်တမ်း သိမ်းဆည်းပြီးပါပြီ။' : 'Record saved successfully.');
        if (reset) reset();
        await loadData();
        await loadVillages();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server error while saving the record.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitForm('/api/production', {
      date: productionForm.date,
      pipeTypeId: productionForm.pipeTypeId,
      quantity: productionForm.quantity,
      batchId: productionForm.batchId,
    }, () => {
      setProductionForm({
        date: getLocalTodayDateString(),
        pipeTypeId: pipeTypes.length > 0 ? pipeTypes[0].id : 0,
        quantity: 0,
        batchId: '',
      });
      setActiveModal(null);
    });
  };

  const handleDistTypeChange = (type: 'normal' | 'resend_damaged') => {
    setDistType(type);
    setSelectedDamagedReturnId('');
    setDistributionForm({
      date: getLocalTodayDateString(),
      village: villages.length > 0 ? villages[0].name : '',
      pipeTypeId: pipeTypes.length > 0 ? pipeTypes[0].id : 0,
      quantity: 0,
      price: 0,
      fromLocation: 'Factory',
      toLocation: 'Village Store',
      remark: '',
      batchId: '',
    });
  };

  const handleDamagedReturnSelect = (idStr: string) => {
    if (!idStr) {
      setSelectedDamagedReturnId('');
      setDistributionForm({
        ...distributionForm,
        village: villages.length > 0 ? villages[0].name : '',
        batchId: '',
        pipeTypeId: 0,
        quantity: 0,
        price: 0,
        remark: '',
      });
      return;
    }
    const ret = returnsList.find(r => r.id === Number(idStr));
    if (ret) {
      setSelectedDamagedReturnId(idStr);
      setDistributionForm({
        ...distributionForm,
        village: ret.village,
        batchId: ret.batch_id || '',
        pipeTypeId: ret.pipe_type_id,
        quantity: Number(ret.quantity || 0),
        price: 0,
        fromLocation: 'Factory',
        toLocation: 'Village Store',
        remark: `is-resent (Resent from damaged return ID: ${ret.id})`,
      });
    }
  };

  const handleQuickResend = (ret: ReturnRecord) => {
    setDistType('resend_damaged');
    setSelectedDamagedReturnId(String(ret.id));
    setDistributionForm({
      date: getLocalTodayDateString(),
      village: ret.village,
      pipeTypeId: ret.pipe_type_id,
      quantity: Number(ret.quantity || 0),
      price: 0,
      fromLocation: 'Factory',
      toLocation: 'Village Store',
      remark: `is-resent (Resent from damaged return ID: ${ret.id})`,
      batchId: ret.batch_id || '',
    });
    setActiveModal('distribution');
  };

  const handleDistributionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);

    try {
      const distRes = await fetch('/api/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: distributionForm.date,
          village: distributionForm.village,
          batchId: distributionForm.batchId,
          quantity: distributionForm.quantity,
          price: distributionForm.price,
          fromLocation: distributionForm.fromLocation,
          toLocation: distributionForm.toLocation,
          remark: distributionForm.remark,
        }),
      });

      const distData = await distRes.json();
      if (!distRes.ok) {
        setMessage(distData.error || 'Failed to save distribution.');
        setIsSubmitting(false);
        return;
      }

      if (distType === 'resend_damaged' && selectedDamagedReturnId) {
        const retRecord = returnsList.find(r => r.id === Number(selectedDamagedReturnId));
        if (retRecord) {
          const newRemark = retRecord.remark 
            ? `${retRecord.remark} is-resent` 
            : 'is-resent';
            
          const retRes = await fetch('/api/returns', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: retRecord.id,
              date: retRecord.date,
              village: retRecord.village,
              batchId: retRecord.batch_id,
              quantity: retRecord.quantity,
              status: retRecord.status,
              price: retRecord.price || 0,
              remark: newRemark,
            }),
          });
          
          const retData = await retRes.json();
          if (!retRes.ok) {
            setMessage(retData.error || 'Failed to update return record as resent.');
          }
        }
      }

      setMessage(language === 'my' ? 'မှတ်တမ်း သိမ်းဆည်းပြီးပါပြီ။' : 'Record saved successfully.');
      
      setDistributionForm({
        date: getLocalTodayDateString(),
        village: villages.length > 0 ? villages[0].name : '',
        pipeTypeId: 0,
        quantity: 0,
        price: 0,
        fromLocation: 'Factory',
        toLocation: 'Village Store',
        remark: '',
        batchId: '',
      });
      setDistType('normal');
      setSelectedDamagedReturnId('');
      setActiveModal(null);
      await loadData();
      await loadVillages();
      await loadAuditLogs();
    } catch (error) {
      setMessage('Server error while saving the record.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { date, village, batchId, status, quantity, price, remark } = returnForm;

    if (quantity <= 0) {
      setMessage(language === 'my' ? 'ပြန်အပ်နှံမည့် အရေအတွက်သည် သုညထက် ကြီးရပါမည်။' : 'Quantity to return must be greater than zero.');
      return;
    }

    if (quantity > selectedReturnBalance) {
      setMessage(
        language === 'my'
          ? 'အမှား - ပြန်အပ်နှံမည့် အရေအတွက်သည် ကျေးရွာရှိ လက်ကျန်ထက် မကျော်လွန်ရပါ။'
          : 'Error: Return quantity exceeds village outstanding balance.'
      );
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const remarkToSend = outstandingResentForSelected > 0
      ? (remark ? `${remark} is-resent` : 'is-resent')
      : remark;

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          village,
          batchId,
          quantity,
          status,
          price: status === 'production_grade' ? price : 0,
          remark: remarkToSend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to save return.');
        setIsSubmitting(false);
        return;
      }

      setMessage(language === 'my' ? 'ပြန်အပ်နှံမှု မှတ်တမ်း သိမ်းဆည်းပြီးပါပြီ။' : 'Returns saved successfully.');
      setReturnForm({
        date: getLocalTodayDateString(),
        village: villages.length > 0 ? villages[0].name : '',
        pipeTypeId: 0,
        status: 'production_grade',
        quantity: 0,
        price: 0,
        remark: '',
        batchId: '',
      });
      setActiveModal(null);
      await loadData();
      await loadVillages();
      await loadAuditLogs();
    } catch (error) {
      setMessage('Server error while saving return records.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceUpdate = async (pipeTypeId: number, unitPrice: number) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/pipe-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeTypeId, unitPrice }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to update price.');
      } else {
        setMessage(language === 'my' ? 'ဈေးနှုန်း အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။' : 'Price updated successfully.');
        await loadData();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server error while updating price.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CRUD Add Actions ---
  const handleAddPipeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipeName || newPipePrice === '') return;
    if (pipeExists) {
      alert(language === 'my' ? 'ဤပိုက်မော်ဒယ်အမည် ရှိနှင့်ပြီးသားဖြစ်သည်' : 'This pipe model already exists in the catalog.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/pipe-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPipeName, unitPrice: Number(newPipePrice) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to add pipe type.');
      } else {
        setMessage(language === 'my' ? `ပိုက်မော်ဒယ် "${newPipeName}" ထည့်သွင်းပြီးပါပြီ။` : `Pipe model "${newPipeName}" added successfully.`);
        setNewPipeName('');
        setNewPipePrice('');
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillageName) return;
    if (villageExists) {
      alert(language === 'my' ? 'ဤကျေးရွာအမည် ရှိနှင့်ပြီးသားဖြစ်သည်' : 'This outpost name already exists in the network.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVillageName }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to add outpost.');
      } else {
        setMessage(language === 'my' ? `ကျေးရွာ "${newVillageName}" အောင်မြင်စွာ မှတ်ပုံတင်ပြီးပါပြီ။` : `Outpost Node "${newVillageName}" registered successfully.`);
        setNewVillageName('');
        await loadVillages();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.carNumber.trim()) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carNumber: carForm.carNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to add car.');
      } else {
        setMessage(language === 'my' ? `ကား "${carForm.carNumber}" အောင်မြင်စွာ မှတ်ပုံတင်ပြီးပါပြီ။` : `Car "${carForm.carNumber}" registered successfully.`);
        setCarForm({ carNumber: '' });
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar || !carForm.carNumber.trim()) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/cars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCar.id, carNumber: carForm.carNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to update car.');
      } else {
        setMessage(language === 'my' ? 'ကားနံပါတ် ပြင်ဆင်ပြီးပါပြီ။' : 'Car number updated successfully.');
        setCarForm({ carNumber: '' });
        setEditingCar(null);
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCarExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { date, carId, amount, reason } = carExpenseForm;
    if (!carId || amount <= 0 || !reason.trim()) {
      alert(language === 'my' ? 'ကျေးဇူးပြု၍ လိုအပ်ချက်များ အားလုံး ဖြည့်သွင်းပါ။' : 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/car-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, carId: Number(carId), amount: Number(amount), reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to record expense.');
      } else {
        setMessage(language === 'my' ? 'အသုံးစရိတ် စာရင်းသွင်းပြီးပါပြီ။' : 'Expense recorded successfully.');
        setCarExpenseForm({
          date: getLocalTodayDateString(),
          carId: cars.length > 0 ? cars[0].id : 0,
          amount: 0,
          reason: '',
        });
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCarExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarExpense) return;
    const { date, carId, amount, reason } = carExpenseForm;
    if (!carId || amount <= 0 || !reason.trim()) {
      alert(language === 'my' ? 'ကျေးဇူးပြု၍ လိုအပ်ချက်များ အားလုံး ဖြည့်သွင်းပါ။' : 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/car-expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCarExpense.id, carId: Number(carId), date, amount: Number(amount), reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to update expense.');
      } else {
        setMessage(language === 'my' ? 'အသုံးစရိတ် ပြင်ဆင်ပြီးပါပြီ။' : 'Expense record updated successfully.');
        setCarExpenseForm({
          date: getLocalTodayDateString(),
          carId: cars.length > 0 ? cars[0].id : 0,
          amount: 0,
          reason: '',
        });
        setEditingCarExpense(null);
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCarIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const { date, carId, amount, reason } = carIncomeForm;
    if (!carId || amount <= 0) {
      alert(language === 'my' ? 'ကျေးဇူးပြု၍ လိုအပ်ချက်များ အားလုံး ဖြည့်သွင်းပါ။' : 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/car-incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, carId: Number(carId), amount: Number(amount), reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to record income.');
      } else {
        setMessage(language === 'my' ? 'ဝင်ငွေ စာရင်းသွင်းပြီးပါပြီ။' : 'Income recorded successfully.');
        setCarIncomeForm({
          date: getLocalTodayDateString(),
          carId: cars.length > 0 ? cars[0].id : 0,
          amount: 0,
          reason: '',
        });
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCarIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarIncome) return;
    const { date, carId, amount, reason } = carIncomeForm;
    if (!carId || amount <= 0) {
      alert(language === 'my' ? 'ကျေးဇူးပြု၍ လိုအပ်ချက်များ အားလုံး ဖြည့်သွင်းပါ။' : 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/car-incomes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCarIncome.id, carId: Number(carId), date, amount: Number(amount), reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to update income.');
      } else {
        setMessage(language === 'my' ? 'ဝင်ငွေ ပြင်ဆင်ပြီးပါပြီ။' : 'Income record updated successfully.');
        setCarIncomeForm({
          date: getLocalTodayDateString(),
          carId: cars.length > 0 ? cars[0].id : 0,
          amount: 0,
          reason: '',
        });
        setEditingCarIncome(null);
        await loadData();
        await loadAuditLogs();
        setActiveModal(null);
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEmailError(null);
    setProfilePasswordError(null);

    const emailToSubmit = profileEmail.trim().toLowerCase();
    if (!emailToSubmit) return;

    if (profilePassword) {
      if (profilePassword.length < 6) {
        setProfilePasswordError(language === 'my' ? 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်။' : 'Password must be at least 6 characters.');
        return;
      }
      if (profilePassword !== profileConfirmPassword) {
        setProfilePasswordError(language === 'my' ? 'စကားဝှက်များ ကိုက်ညီမှု မရှိပါ။' : 'Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSubmit,
          password: profilePassword ? profilePassword : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.includes('Email')) {
          setProfileEmailError(data.error);
        } else {
          setMessage(data.error || 'Failed to update profile.');
        }
      } else {
        setMessage(language === 'my' ? 'ပရိုဖိုင် ပြင်ဆင်မှု အောင်မြင်ပါသည်။' : 'Profile successfully updated.');
        setUser((prev: any) => ({ ...prev, email: data.user.email }));
        setActiveModal(null);
      }
    } catch (err) {
      setMessage('Server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CRUD Delete Actions ---
  const handleDeletePipeType = async (id: number) => {
    const confirmMsg = language === 'my' 
      ? 'ဤပိုက်မော်ဒယ်အား ကတ်တလောက်မှ ဖျက်သိမ်းရန် သေချာပါသလား?' 
      : 'Are you sure you want to delete this pipe model from the active catalog?';
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/pipe-types?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete pipe model.');
      } else {
        setMessage(language === 'my' ? 'ပိုက်မော်ဒယ်အား ဖျက်သိမ်းပြီးပါပြီ။' : 'Pipe model successfully removed from catalog.');
        await loadData();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVillage = async (id: number) => {
    const confirmMsg = language === 'my' 
      ? 'ဤကျေးရွာအား ကွန်ရက်စာရင်းမှ ဖျက်သိမ်းရန် သေချာပါသလား?' 
      : 'Are you sure you want to remove this outpost node from the network registry?';
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/villages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete outpost.');
      } else {
        setMessage(language === 'my' ? 'ကျေးရွာအား ကွန်ရက်စာရင်းမှ ဖျက်သိမ်းပြီးပါပြီ။' : 'Outpost node successfully removed from network registry.');
        await loadVillages();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCar = async (id: number, carNumber: string) => {
    const confirmMsg = language === 'my' 
      ? `ဤဖယ်ရီကား "${carNumber}" ကို ဖျက်ရန် သေချာပါသလား? ၎င်းနှင့်ပတ်သက်သော ဝင်ငွေ၊ ထွက်ငွေမှတ်တမ်းများအားလုံး ပျက်သွားပါမည်။` 
      : `Are you sure you want to delete car "${carNumber}"? All associated income and expense records will be deleted as well.`;
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/cars?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete car.');
      } else {
        setMessage(language === 'my' ? 'ဖယ်ရီကားအား ဖျက်သိမ်းပြီးပါပြီ။' : 'Ferry car successfully deleted.');
        if (selectedCarId === id) {
          setSelectedCarId('all');
        }
        await loadData();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCarExpense = async (id: number) => {
    const confirmMsg = language === 'my' 
      ? 'ဤကားအသုံးစရိတ်မှတ်တမ်းအား ဖျက်ရန် သေချာပါသလား?' 
      : 'Are you sure you want to delete this car expense record?';
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/car-expenses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete expense record.');
      } else {
        setMessage(language === 'my' ? 'အသုံးစရိတ်မှတ်တမ်း ဖျက်ပြီးပါပြီ။' : 'Expense record successfully deleted.');
        await loadData();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCarIncome = async (id: number) => {
    const confirmMsg = language === 'my' 
      ? 'ဤကားဝင်ငွေမှတ်တမ်းအား ဖျက်ရန် သေချာပါသလား?' 
      : 'Are you sure you want to delete this car income record?';
    if (!confirm(confirmMsg)) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/car-incomes?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Failed to delete income record.');
      } else {
        setMessage(language === 'my' ? 'ဝင်ငွေမှတ်တမ်း ဖျက်ပြီးပါပြီ။' : 'Income record successfully deleted.');
        await loadData();
        await loadAuditLogs();
      }
    } catch (error) {
      setMessage('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Ferry Car Calculations & Filtering ---
  const carStats = useMemo(() => {
    const targetExpenses = selectedCarId === 'all' 
      ? carExpenses 
      : carExpenses.filter(e => e.car_id === selectedCarId);
    
    const targetIncomes = selectedCarId === 'all' 
      ? carIncomes 
      : carIncomes.filter(i => i.car_id === selectedCarId);

    const totalIncome = targetIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpense = targetExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const netBalance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netBalance };
  }, [carExpenses, carIncomes, selectedCarId]);

  const carsWithBalances = useMemo(() => {
    return cars.map(car => {
      const targetExpenses = carExpenses.filter(e => e.car_id === car.id);
      const targetIncomes = carIncomes.filter(i => i.car_id === car.id);
      const totalIncome = targetIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalExpense = targetExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const netBalance = totalIncome - totalExpense;
      return {
        ...car,
        totalIncome,
        totalExpense,
        netBalance
      };
    });
  }, [cars, carExpenses, carIncomes]);

  const filteredCarExpenses = useMemo(() => {
    if (selectedCarId === 'all') return carExpenses;
    return carExpenses.filter(e => e.car_id === selectedCarId);
  }, [carExpenses, selectedCarId]);

  const filteredCarIncomes = useMemo(() => {
    if (selectedCarId === 'all') return carIncomes;
    return carIncomes.filter(i => i.car_id === selectedCarId);
  }, [carIncomes, selectedCarId]);

  // --- Dynamic Live Alerts Calculation ---
  const systemAlerts = useMemo(() => {
    const alerts: Array<{ type: 'low-stock' | 'damaged' | 'info'; text: string }> = [];

    // 1. Low Stock Alerts
    pipeTypes.forEach((pipe) => {
      const stock = factoryStockMap[pipe.id] || 0;
      if (stock < 20) {
        const text = language === 'my'
          ? `သတိပေးချက်- စတော့ခ် နည်းပါးနေသည်! "${pipe.name}" အတွက် စက်ရုံလက်ကျန် ${stock} ယူနစ်သာ ရှိပါတော့သည်။`
          : `Alert: Low Stock! Central stock for "${pipe.name}" is at ${stock} units.`;
        alerts.push({ type: 'low-stock', text });
      }
    });

    // 2. Damaged Returns Alerts
    const damagedCount = returnsList.filter((r) => r.status === 'damaged').length;
    if (damagedCount > 0) {
      const text = language === 'my'
        ? `စစ်ဆေးမှု သတိပေးချက်- ချို့ယွင်းပျက်စီးနေသော ပြန်အပ်ပိုက် ${damagedCount} ယူနစ် တွေ့ရှိသဖြင့် သီးခြားခွဲထုတ်ထားပါသည်။`
        : `Inspection Alert: ${damagedCount} returned pipe(s) classified as DAMAGED requiring QC quarantine.`;
      alerts.push({ type: 'damaged', text });
    }

    // 3. Outposts Deployed alert
    if (activeVillages > 0) {
      const text = language === 'my'
        ? `စနစ် အချက်အလက်- ကျေးရွာစခန်းပေါင်း ${activeVillages} ခုသို့ ကုန်ပစ္စည်းများ ဖြန့်ဖြူးပေးပို့နေပါသည်။`
        : `System Info: Currently distributing pipes actively across ${activeVillages} distinct outposts.`;
      alerts.push({ type: 'info', text });
    }

    return alerts;
  }, [pipeTypes, factoryStockMap, returnsList, activeVillages, language]);

  // --- QC Batch Registry Compilation ---
  const batchQCLogs = useMemo(() => {
    const batchRegistry: Record<string, {
      batchId: string;
      pipeName: string;
      quantity: number;
      date: string;
      hasDamagedReturns: boolean;
      totalReturns: number;
    }> = {};

    productions.forEach((prod) => {
      const bId = prod.batch_id || 'UNKNOWN';
      if (!batchRegistry[bId]) {
        const pipeName = pipeTypes.find((p) => p.id === prod.pipe_type_id)?.name || 'Unknown Pipe';
        const returns = returnsList.filter((r) => r.pipe_type_id === prod.pipe_type_id);
        const damaged = returns.some((r) => r.status === 'damaged');

        batchRegistry[bId] = {
          batchId: bId,
          pipeName,
          quantity: prod.quantity,
          date: prod.date,
          hasDamagedReturns: damaged,
          totalReturns: sumQuantity(returns),
        };
      } else {
        batchRegistry[bId].quantity += prod.quantity;
      }
    });

    return Object.values(batchRegistry).filter((b) => 
      b.batchId.toLowerCase().includes(searchBatchId.toLowerCase())
    );
  }, [productions, pipeTypes, returnsList, searchBatchId]);

  // --- Dynamic Search/Filtering on Data Logs ---
  const filteredDistributions = useMemo(() => {
    return distributions.filter((item) => {
      const matchVillage = filterVillage === 'All' || item.village === filterVillage;
      const matchPipeType = filterPipeType === 'All' || item.pipe_type_id === Number(filterPipeType);
      const matchBatchId = filterBatchId === 'All' || item.batch_id === filterBatchId;
      
      let matchDate = true;
      if (isSpecificDate) {
        matchDate = !filterStartDate || item.date === filterStartDate;
      } else {
        const itemDate = new Date(item.date);
        const matchStart = !filterStartDate || itemDate >= new Date(filterStartDate);
        const matchEnd = !filterEndDate || itemDate <= new Date(filterEndDate);
        matchDate = matchStart && matchEnd;
      }

      const pipeName = pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || '';
      const query = searchDistributionQuery.toLowerCase();
      const matchSearch = !query ||
        item.village.toLowerCase().includes(query) ||
        (item.batch_id || '').toLowerCase().includes(query) ||
        pipeName.toLowerCase().includes(query) ||
        (item.remark || '').toLowerCase().includes(query);

      return matchVillage && matchPipeType && matchBatchId && matchDate && matchSearch;
    });
  }, [distributions, filterVillage, filterPipeType, filterBatchId, filterStartDate, filterEndDate, isSpecificDate, searchDistributionQuery, pipeTypes]);

  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      const matchVillage = filterVillage === 'All' || item.village === filterVillage;
      const matchPipeType = filterPipeType === 'All' || item.pipe_type_id === Number(filterPipeType);
      const matchStatus = filterStatus === 'All' || item.status === filterStatus;
      const matchBatchId = filterBatchId === 'All' || item.batch_id === filterBatchId;

      let matchDate = true;
      if (isSpecificDate) {
        matchDate = !filterStartDate || item.date === filterStartDate;
      } else {
        const itemDate = new Date(item.date);
        const matchStart = !filterStartDate || itemDate >= new Date(filterStartDate);
        const matchEnd = !filterEndDate || itemDate <= new Date(filterEndDate);
        matchDate = matchStart && matchEnd;
      }

      const pipeName = pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || '';
      const query = searchReturnsQuery.toLowerCase();
      const matchSearch = !query ||
        item.village.toLowerCase().includes(query) ||
        (item.batch_id || '').toLowerCase().includes(query) ||
        pipeName.toLowerCase().includes(query) ||
        (item.remark || '').toLowerCase().includes(query);

      return matchVillage && matchPipeType && matchStatus && matchBatchId && matchDate && matchSearch;
    });
  }, [returnsList, filterVillage, filterPipeType, filterStatus, filterBatchId, filterStartDate, filterEndDate, isSpecificDate, searchReturnsQuery, pipeTypes]);

  // --- Weekly Delivery Velocity Calculation ---
  const weeklyVelocity = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };
    
    distributions.forEach((d) => {
      try {
        const dateObj = new Date(d.date);
        const dayName = days[dateObj.getUTCDay()];
        if (dayName && counts[dayName] !== undefined) {
          counts[dayName] += Number(d.quantity || 0);
        }
      } catch (e) {}
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      label: day,
      quantity: counts[day],
      percentage: Math.min(Math.round((counts[day] / maxVal) * 100), 100),
    }));
  }, [distributions]);

  const filteredProductions = useMemo(() => {
    return productions.filter((item) => {
      const matchBatch = (item.batch_id || '').toLowerCase().includes(searchBatchId.toLowerCase());
      if (isSpecificDate) {
        return matchBatch && (!filterStartDate || item.date === filterStartDate);
      }
      const itemDate = new Date(item.date);
      const matchStart = !filterStartDate || itemDate >= new Date(filterStartDate);
      const matchEnd = !filterEndDate || itemDate <= new Date(filterEndDate);
      return matchBatch && matchStart && matchEnd;
    });
  }, [productions, searchBatchId, filterStartDate, filterEndDate, isSpecificDate]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (!log.timestamp) return true;
      const logDatePart = log.timestamp.substring(0, 10);
      if (isSpecificDate) {
        return !filterStartDate || logDatePart === filterStartDate;
      }
      if (filterStartDate && logDatePart < filterStartDate) return false;
      if (filterEndDate && logDatePart > filterEndDate) return false;
      return true;
    });
  }, [auditLogs, filterStartDate, filterEndDate, isSpecificDate]);

  // --- Cash Flow (Funding) Client-Side Filtering ---
  const filteredFundingList = useMemo(() => {
    return fundingList.filter((f) => {
      const matchVillage = filterFundingVillage === 'All' || f.village === filterFundingVillage;
      const matchType = filterFundingType === 'All' || f.type === filterFundingType;
      
      const matchStart = !filterFundingStartDate || f.date >= filterFundingStartDate;
      const matchEnd = !filterFundingEndDate || f.date <= filterFundingEndDate;
      
      return matchVillage && matchType && matchStart && matchEnd;
    });
  }, [fundingList, filterFundingVillage, filterFundingType, filterFundingStartDate, filterFundingEndDate]);

  const filteredPipeTypes = useMemo(() => {
    return pipeTypes.filter((pipe) =>
      pipe.name.toLowerCase().includes(searchPipeQuery.toLowerCase())
    );
  }, [pipeTypes, searchPipeQuery]);

  const filteredVillages = useMemo(() => {
    return villages.filter((v) =>
      v.name.toLowerCase().includes(searchVillageQuery.toLowerCase())
    );
  }, [villages, searchVillageQuery]);

  const pipeExists = useMemo(() => {
    return newPipeName.trim() !== '' && pipeTypes.some(
      (pipe) => pipe.name.toLowerCase().trim() === newPipeName.toLowerCase().trim()
    );
  }, [pipeTypes, newPipeName]);

  const villageExists = useMemo(() => {
    return newVillageName.trim() !== '' && villages.some(
      (v) => v.name.toLowerCase().trim() === newVillageName.toLowerCase().trim()
    );
  }, [villages, newVillageName]);

  const editVillageExists = useMemo(() => {
    return editVillageName.trim() !== '' && !!editingVillage &&
      editVillageName.toLowerCase().trim() !== editingVillage.name.toLowerCase().trim() &&
      villages.some((v) => v.name.toLowerCase().trim() === editVillageName.toLowerCase().trim());
  }, [villages, editVillageName, editingVillage]);

  // --- Finance Parsing & Client-Side Filtering ---
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredFinanceData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current calendar week (Monday)
    const dayOfWeek = today.getDay();
    const mondayDiff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), mondayDiff);
    
    // Start of current calendar month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const isWithinPeriod = (dateStr: string) => {
      if (financePeriod === 'custom') {
        if (isSpecificDate) {
          return !filterStartDate || dateStr === filterStartDate;
        }
        if (filterStartDate && dateStr < filterStartDate) return false;
        if (filterEndDate && dateStr > filterEndDate) return false;
        return true;
      }
      if (financePeriod === 'all') return true;
      try {
        const itemDate = parseLocalDate(dateStr);
        if (financePeriod === 'day') {
          return itemDate.getTime() === today.getTime();
        }
        if (financePeriod === 'week') {
          return itemDate >= startOfWeek;
        }
        if (financePeriod === 'month') {
          return itemDate >= startOfMonth;
        }
      } catch (e) {
        return false;
      }
      return true;
    };

    return {
      dists: distributions.filter((d) => isWithinPeriod(d.date) && (!d.remark || !d.remark.includes('is-resent'))),
      rets: returnsList.filter((r) => isWithinPeriod(r.date) && r.status === 'production_grade'),
    };
  }, [distributions, returnsList, financePeriod, filterStartDate, filterEndDate, isSpecificDate]);

  const financeKPIs = useMemo(() => {
    const { dists, rets } = filteredFinanceData;

    const totalRevenue = dists.reduce((sum, d) => sum + (Number(d.quantity || 0) * Number(d.price || 0)), 0);
    const totalRefunds = rets.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.price || 0)), 0);
    const netProfit = (totalRefunds - totalRevenue) * (-1);
    const totalProductionCostOfReturns = rets.reduce((sum, r) => {
      const pt = pipeTypes.find((p) => p.id === r.pipe_type_id);
      const prodPrice = pt ? Number(pt.unit_price || 0) : 0;
      return sum + (Number(r.quantity || 0) * prodPrice);
    }, 0);
    const refundRate = totalProductionCostOfReturns > 0 ? (totalRefunds / totalProductionCostOfReturns) * 100 : 0;

    return {
      totalRevenue,
      totalRefunds,
      netProfit,
      refundRate,
    };
  }, [filteredFinanceData, pipeTypes]);

  const modelFinanceData = useMemo(() => {
    const { dists, rets } = filteredFinanceData;

    return pipeTypes.map((pipe) => {
      const modelDists = dists.filter((d) => d.pipe_type_id === pipe.id);
      const modelReturns = rets.filter((r) => r.pipe_type_id === pipe.id);

      const totalDistQty = modelDists.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
      const totalDistRevenue = modelDists.reduce((sum, d) => sum + (Number(d.quantity || 0) * Number(d.price || 0)), 0);
      const avgSalesPrice = totalDistQty > 0 ? totalDistRevenue / totalDistQty : 0;
      const salesMargin = avgSalesPrice > 0 ? avgSalesPrice - pipe.unit_price : 0;

      const totalRetQty = modelReturns.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
      const totalRetRefund = modelReturns.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.price || 0)), 0);
      const avgRebuyPrice = totalRetQty > 0 ? totalRetRefund / totalRetQty : 0;
      const priceDiff = avgRebuyPrice > 0 ? avgRebuyPrice - pipe.unit_price : 0;

      return {
        id: pipe.id,
        name: pipe.name,
        productionPrice: pipe.unit_price,
        totalDistQty,
        avgSalesPrice,
        salesMargin,
        totalRetQty,
        avgRebuyPrice,
        priceDiff,
      };
    });
  }, [filteredFinanceData, pipeTypes]);

  const batchFinanceData = useMemo(() => {
    const { rets } = filteredFinanceData;
    const uniqueBatches = Array.from(
      new Set([
        ...productions.map((p) => p.batch_id),
        ...rets.map((r) => r.batch_id)
      ].filter(Boolean))
    );

    return uniqueBatches.map((batchId) => {
      const firstProd = productions.find((p) => p.batch_id === batchId);
      let pipeType = firstProd ? pipeTypes.find((pt) => pt.id === firstProd.pipe_type_id) : null;

      if (!pipeType) {
        const firstRet = rets.find((r) => r.batch_id === batchId);
        if (firstRet) {
          pipeType = pipeTypes.find((pt) => pt.id === firstRet.pipe_type_id);
        }
      }

      const modelName = pipeType ? pipeType.name : 'Unknown Model';
      const productionPrice = pipeType ? pipeType.unit_price : 0;

      const batchReturns = rets.filter((r) => r.batch_id === batchId);
      const totalRetQty = batchReturns.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
      const totalRetRefund = batchReturns.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.price || 0)), 0);

      const avgRebuyPrice = totalRetQty > 0 ? totalRetRefund / totalRetQty : 0;
      const ratio = productionPrice > 0 ? (avgRebuyPrice / productionPrice) * 100 : 0;

      return {
        batchId: batchId!,
        modelName,
        productionPrice,
        avgRebuyPrice,
        ratio,
        totalRetQty,
      };
    });
  }, [filteredFinanceData, productions, pipeTypes]);

  // --- Main Render Loading Screen ---
  if (isSessionChecking) {
    return (
      <div className="login-viewport">
        <div className="premium-loader-container">
          <div className="spinner-wrapper">
            <div className="spinner-ring outer-ring" />
            <div className="spinner-ring inner-ring" />
            <div className="spinner-center">T</div>
          </div>
          <div className="loader-title">TrammelNet</div>
          <div className="loader-text">
            {language === 'my' ? 'စနစ်ပတ်ဝန်းကျင်အား ပြင်ဆင်နေသည်...' : 'LOADING USER ENVIRONMENT'}
          </div>
        </div>
      </div>
    );
  }

  // --- Main Render Login Screen overlay ---
  if (!user) {
    return (
      <div className="login-viewport">
        <div className="login-pane">
          <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--accent, #4f46e5)', marginBottom: '16px' }}>TrammelNet</div>
          <h2>{isRegistering ? (language === 'my' ? 'အက်ဒမင် အကောင့်ပြုလုပ်ရန်' : 'Create Admin Account') : (language === 'my' ? 'စနစ်ထဲသို့ ဝင်ရန်' : 'Sign in to TrammelNet')}</h2>
          <p className="login-subtitle">
            {isRegistering 
              ? (language === 'my' ? 'စနစ်ထိန်းချုပ်ရန် အက်ဒမင်အကောင့်အသစ်တစ်ခု ဖန်တီးပါ။' : 'Provision a new administrator account for system control.')
              : (language === 'my' ? 'ကုန်ပစ္စည်းများနှင့် အရည်အသွေးထိန်းချုပ်မှုကို စီမံခန့်ခွဲရန် ဝင်ရောက်ပါ။' : 'Access centralized inventory management and quality tracking.')}
          </p>

          {message && <div className="alert">{message}</div>}

          <form onSubmit={isRegistering ? handleRegisterAdmin : handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">{language === 'my' ? 'အီးမေးလ် လိပ်စာ' : 'Email Address'}</label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">{language === 'my' ? 'လျှို့ဝှက်နံပါတ်' : 'Password'}</label>
              <input
                id="login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (language === 'my' ? 'ခဏစောင့်ပါ...' : 'Please wait...') 
                : isRegistering ? (language === 'my' ? 'အက်ဒမင် မှတ်ပုံတင်ရန်' : 'Register Administrator') : (language === 'my' ? 'ဝင်ရောက်မည်' : 'Sign In')}
            </button>
          </form>

          {/* <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button 
              type="button" 
              className="text-link" 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage(null);
              }}
            >
              {isRegistering 
                ? (language === 'my' ? 'စနစ်ထဲသို့ဝင်ရန် အကောင့်ရှိပြီးသားဖြစ်သည်' : 'Already have an account? Sign In') 
                : (language === 'my' ? 'အက်ဒမင်အကောင့်အသစ်တစ်ခု ဖန်တီးပါ' : 'Create new Administrator account')}
            </button>
          </div> */}

          
        </div>
      </div>
    );
  }



  return (
    <div className={`dashboard-layout ${language === 'my' ? 'lang-my' : 'lang-en'}`}>
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Logo block */}
        <div className="logo-block" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--accent, #4f46e5)' }}>
            TrammelNet
          </div>
          <div className="sidebar-subtitle" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, fontWeight: '600' }}>
            Inventory App
          </div>
          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
            style={{ position: 'absolute', right: '16px', top: '16px' }}
          >
            &times;
          </button>
        </div>
        
        <nav>
          {sidebarTabs.map((tab) => {
            const icons: Record<string, string> = {
              Overview: '📊',
              Production: '🏭',
              Distribution: '🚚',
              Returns: '🔄',
              Reconciliation: '⚖️',
              Finance: '💰',
              Reports: '📋',
              'Catalog Settings': '⚙️',
              'Audit Logs': '📜',
            };
            const labelMap: Record<string, string> = {
              Overview: t.overview,
              Production: t.production,
              Distribution: t.distribution,
              Returns: t.returns,
              Reconciliation: t.overallDistributeSummary,
              Finance: t.finance,
              Reports: t.reports,
              'Catalog Settings': t.catalogSettings,
              'Audit Logs': t.auditLogs,
            };
            return (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'sidebar-link active' : 'sidebar-link'}
                onClick={() => {
                  router.push(`?tab=${encodeURIComponent(tab)}`);
                  setIsSidebarOpen(false);
                }}
              >
                <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>{icons[tab] || '📁'}</span>
                <span className="link-text">{labelMap[tab] || tab}</span>
              </button>
            );
          })}
          {isInstallable && (
            <button
              type="button"
              className="sidebar-link install-sidebar-btn"
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, var(--accent, #4f46e5) 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                width: 'calc(100% - 24px)',
                margin: '16px 12px 0 12px',
              }}
              onClick={() => window.promptPwaInstall()}
            >
              <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>📱</span>
              <span className="link-text">{t.installApp}</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          {/* SIDEBAR PROFILE WIDGET */}
          <div className="sidebar-profile-container" style={{ position: 'relative', width: '100%' }}>
            <button 
              type="button" 
              className={`sidebar-profile-trigger ${isProfileOpen ? 'active' : ''}`}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Toggle profile menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                border: '1px solid var(--border-color)',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
            >
              <div className="profile-avatar" style={{ flexShrink: 0 }}>
                {user.email.split('@')[0].slice(0, 2).toUpperCase()}
              </div>
              <div className="profile-info-text" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, textAlign: 'left', alignItems: 'flex-start' }}>
                <span className="profile-name" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {user.email.split('@')[0]}
                </span>
                <span className="profile-role" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                  {user.role === 'admin' ? 'Administrator' : 'Viewer'}
                </span>
              </div>
              <span className="profile-chevron" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {isProfileOpen ? '▼' : '▲'}
              </span>
            </button>
            
            {isProfileOpen && (
              <div 
                className="sidebar-profile-dropdown"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: '10px',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.05)',
                  zIndex: 1000,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'fadeInSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}
              >
                <div className="dropdown-header-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p className="dropdown-email" style={{ fontSize: '0.82rem', fontWeight: 550, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user.email}</p>
                  <span className={`role-badge badge-${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'Viewer'}
                  </span>
                </div>
                
                <div className="dropdown-divider"></div>
                
                {/* Language switcher */}
                <div className="dropdown-lang-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="dropdown-section-title" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {language === 'my' ? 'ဘာသာစကား' : 'Language'}
                  </span>
                  <div className="dropdown-lang-pill-row">
                    <button 
                      type="button" 
                      className={`lang-pill-btn ${language === 'en' ? 'active' : ''}`}
                      onClick={() => setLanguage('en')}
                    >
                      EN
                    </button>
                    <button 
                      type="button" 
                      className={`lang-pill-btn ${language === 'my' ? 'active' : ''}`}
                      onClick={() => setLanguage('my')}
                    >
                      မြန်မာ
                    </button>
                  </div>
                </div>
                {isInstallable && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button 
                      type="button" 
                      className="dropdown-install-btn" 
                      onClick={() => {
                        setIsProfileOpen(false);
                        window.promptPwaInstall();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--accent-light, rgba(79, 70, 229, 0.08))',
                        color: 'var(--accent, #4f46e5)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>📱</span>
                      <span>{t.installApp}</span>
                    </button>
                  </>
                )}
                
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.03))',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    color: 'var(--text-primary, #0f172a)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => {
                    setIsProfileOpen(false);
                    setProfileEmail(user.email);
                    setProfilePassword('');
                    setProfileConfirmPassword('');
                    setProfileEmailError(null);
                    setProfilePasswordError(null);
                    setActiveModal('update_profile');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, rgba(0,0,0,0.06))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary, rgba(0,0,0,0.03))';
                  }}
                >
                  <span>⚙️</span>
                  <span>{language === 'my' ? 'ပရိုဖိုင် ပြင်ဆင်ရန်' : 'Update Profile'}</span>
                </button>

                <div className="dropdown-divider"></div>
                <button type="button" className="dropdown-logout-btn" onClick={handleLogout}>
                  <span className="logout-icon">🚪</span>
                  <span>{t.signOut}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-left-side">
            <div className="header-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1>{PAGE_TITLES[activeTab]?.[language] || activeTab}</h1>
              <span className={`network-badge ${isOffline ? 'offline' : 'online'}`}>
                <span className="dot"></span>
                <span className="text">{isOffline ? t.isOffline : t.isOnline}</span>
              </span>
            </div>
            {PAGE_SUBHEADINGS[activeTab]?.[language] && (
              <p className="subheading">
                {PAGE_SUBHEADINGS[activeTab]?.[language]}
              </p>
            )}
          </div>
          <div className="header-right-side">
            {user.role === 'admin' && (
              <div className="header-actions">
                {activeTab === 'Production' && (
                  <button 
                    className="primary" 
                    onClick={() => setActiveModal('production')}
                  >
                    {t.addProduction}
                  </button>
                )}
                {activeTab === 'Distribution' && (
                  <button 
                    className="primary" 
                    onClick={() => setActiveModal('distribution')}
                  >
                    {t.addDistribution}
                  </button>
                )}
                {activeTab === 'Returns' && (
                  <button 
                    className="primary" 
                    onClick={() => setActiveModal('return')}
                  >
                    {t.addReturn}
                  </button>
                )}
                {activeTab === 'Catalog Settings' && (
                  <div className="catalog-actions-row">
                    <button 
                      className="secondary" 
                      onClick={() => setActiveModal('new_pipe')}
                    >
                      {t.newPipeModel}
                    </button>
                    <button 
                      className="primary" 
                      onClick={() => setActiveModal('new_outpost')}
                    >
                      {t.newOutpostNode}
                    </button>
                  </div>
                )}
              </div>
            )}


          </div>
        </div>

        {message ? (
          <div className="alert">
            <span>ℹ️</span>
            <span>{message}</span>
          </div>
        ) : null}

        <div className="workspace-scrollable">
          
          {/* OVERVIEW TAB RENDER */}
          {activeTab === 'Overview' && (
            <>
              <div className="stats-grid cols-5">
                <div className="summary-card">
                  <p>{t.totalProduction}</p>
                  <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : totalProduction}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.totalDistributedUnits}</p>
                  <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : totalDistributed}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.totalReturnedUnits}</p>
                  <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : totalReturned}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.leftToReturn}</p>
                  <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : (totalDistributed - totalReturned)}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.currentBalance}</p>
                  <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : currentBalance}</h3>
                </div>
              </div>

              <div className="overview-grid" style={{ minHeight: '320px' }}>
                <div className="pane-column left-pane">
                  <div className="pane-header">
                    <h2>{t.weeklyDeliveryVelocity}</h2>
                    <span>{t.last7Days}</span>
                  </div>
                  
                  <div className="chart-container-pane">
                    <div className="chart-axis-lines">
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                    </div>

                    <div className="chart-bars-wrapper">
                      {isDataLoading ? (
                        Array.from({ length: 7 }).map((_, idx) => (
                          <div key={idx} className="chart-bar-col">
                            <div className="skeleton-box" style={{ height: `${(idx * 15) % 60 + 20}%`, width: '44px', borderRadius: '6px' }} />
                          </div>
                        ))
                      ) : (
                        weeklyVelocity.map((item, index) => {
                          const dayNames: Record<string, string> = {
                            Mon: language === 'my' ? 'တနင်္လာ' : 'Mon',
                            Tue: language === 'my' ? 'အင်္ဂါ' : 'Tue',
                            Wed: language === 'my' ? 'ဗုဒ္ဓဟူး' : 'Wed',
                            Thu: language === 'my' ? 'ကြာသပတေး' : 'Thu',
                            Fri: language === 'my' ? 'သောကြာ' : 'Fri',
                            Sat: language === 'my' ? 'စနေ' : 'Sat',
                            Sun: language === 'my' ? 'တနင်္ဂနွေ' : 'Sun',
                          };
                          return (
                            <div key={index} className="chart-bar-col">
                              <div
                                className="chart-bar-fill"
                                style={{ height: `${item.percentage}%` }}
                                data-value={`${item.quantity} ${language === 'my' ? 'ယူနစ်' : 'units'}`}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="chart-bar-labels">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const labelMap: Record<string, string> = {
                          Mon: language === 'my' ? 'နင်္လာ' : 'Mon',
                          Tue: language === 'my' ? 'အင်္ဂါ' : 'Tue',
                          Wed: language === 'my' ? 'ဟူး' : 'Wed',
                          Thu: language === 'my' ? 'တေး' : 'Thu',
                          Fri: language === 'my' ? 'ကြာ' : 'Fri',
                          Sat: language === 'my' ? 'စနေ' : 'Sat',
                          Sun: language === 'my' ? 'နွေ' : 'Sun',
                        };
                        return (
                          <div key={day} className="chart-label-item">{labelMap[day] || day}</div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pane-column">
                  <div className="pane-header">
                    <h2>{t.realTimeSystemAlerts}</h2>
                    <span>{systemAlerts.length} {t.activeNotifications}</span>
                  </div>

                  <div className="notifications-widget">
                    {isDataLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="notification-item alert-info" style={{ pointerEvents: 'none', background: 'transparent', border: 'none', padding: '10px 0' }}>
                          <div className="skeleton-box" style={{ width: '100%', height: '1.2rem' }} />
                        </div>
                      ))
                    ) : systemAlerts.length === 0 ? (
                      <div className="notification-item alert-info">
                        {t.systemStatusOptimal}
                      </div>
                    ) : (
                      systemAlerts.map((alert, index) => (
                        <div 
                          key={index} 
                          className={`notification-item ${
                            alert.type === 'low-stock' 
                              ? 'alert-low-stock' 
                              : alert.type === 'damaged' 
                              ? 'alert-damaged' 
                              : 'alert-info'
                          }`}
                        >
                          {alert.type === 'low-stock' ? '⚠️' : alert.type === 'damaged' ? '🚨' : 'ℹ️'} {alert.text}
                        </div>
                      ))
                    )}
                  </div>

                </div>
              </div>

              {/* SVG Analytics Charts Section */}
              <div className="table-panel analytics-panel">
                <h2 style={{ marginBottom: '32px', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600' }}>
                  {language === 'my' ? 'စီးပွားရေးဆိုင်ရာ စာရင်းဇယားများ' : 'Inventory Analytics Visualizations'}
                </h2>
                
                <div className="charts-flex-row">
                  
                  {/* Live Matrix: Process Activity Records */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', flex: 1, maxWidth: '480px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {language === 'my' ? 'တိုက်ရိုက် စာရင်းဇယား မက်ထရစ်များ' : 'Live Activity Matrix'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {language === 'my' ? 'လုပ်ငန်းစဉ်အလိုက် လုပ်ဆောင်မှု မှတ်တမ်းများ' : 'Process execution metrics & operational node counts'}
                      </span>
                    </div>
                    <div className="quick-metrics-stack">
                      {isDataLoading ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className="metric-strip" style={{ background: 'var(--bg-primary)', pointerEvents: 'none' }}>
                            <div className="skeleton-box" style={{ width: '50%', height: '1rem' }} />
                            <div className="skeleton-box" style={{ width: '15%', height: '1.25rem' }} />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="metric-strip" style={{ background: 'var(--bg-primary)' }}>
                            <span className="metric-strip-label">
                              {language === 'my' ? 'ကုန်ထုတ်လုပ်မှု လုပ်ငန်းစဉ် မှတ်တမ်းများ' : 'Production Process Logs'}
                            </span>
                            <span className="metric-strip-value">{productions.length}</span>
                          </div>
                          <div className="metric-strip" style={{ background: 'var(--bg-primary)' }}>
                            <span className="metric-strip-label">
                              {language === 'my' ? 'ဖြန့်ဖြူးမှု လုပ်ငန်းစဉ် မှတ်တမ်းများ' : 'Distribution Process Logs'}
                            </span>
                            <span className="metric-strip-value">{distributions.length}</span>
                          </div>
                          <div className="metric-strip" style={{ background: 'var(--bg-primary)' }}>
                            <span className="metric-strip-label">
                              {language === 'my' ? 'ပြန်အပ်နှံမှု လုပ်ငန်းစဉ် မှတ်တမ်းများ' : 'Return Process Logs'}
                            </span>
                            <span className="metric-strip-value">{returnsList.length}</span>
                          </div>
                          <div className="metric-strip" style={{ background: 'var(--bg-primary)' }}>
                            <span className="metric-strip-label">
                              {t.outpostsServed}
                            </span>
                            <span className="metric-strip-value">{activeVillages}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chart: Pipe type usage doughnut chart */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', minHeight: '380px', width: '100%', maxWidth: '600px', flex: 1.2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {language === 'my' ? 'ပိုက်မော်ဒယ် အသုံးပြုမှုနှုန်း' : 'Pipe Model Usage Ratio'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {language === 'my' ? 'မော်ဒယ်အမျိုးအစားအလိုက် စုစုပေါင်း ဖြန့်ဖြူးမှုအချိုးအစား' : 'Breakdown of different pipe models across deliveries'}
                      </span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PipeTypeDoughnutChart />
                    </div>
                  </div>

                </div>

                {/* Row 2: Most Damaged Outposts & Left to Return by Batch & Model */}
                <div className="charts-flex-row" style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
                  
                  {/* Widget 1: Most Damaged Outposts */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', flex: 1, maxWidth: '550px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t.damagedByVillageBatchModel}
                      </span>
                  
                    </div>
                    
                    <div className="quick-metrics-stack" style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '260px' }}>
                      {mostDamagedVillageData.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                          {t.noDamagedReturnsYet}
                        </div>
                      ) : (
                        mostDamagedVillageData.slice(0, 5).map((item, idx) => {
                          const maxQty = mostDamagedVillageData[0]?.quantity || 1;
                          const ratio = (item.quantity / maxQty) * 100;
                          const pipeName = pipeTypes.find((p) => p.id === item.pipeTypeId)?.name || 'Unknown';
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {item.village}
                                </span>
                                <span style={{ color: 'var(--danger)', fontWeight: '700' }}>
                                  {item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span>
                                  {language === 'my' ? 'မော်ဒယ်: ' : 'Model: '}<strong>{pipeName}</strong>
                                </span>
                                <span>
                                  Batch ID:{' '}
                                  {item.batchId && item.batchId !== 'Unknown' ? (
                                    <button
                                      type="button"
                                      className="link-btn"
                                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary, var(--accent))', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600', fontSize: '0.75rem' }}
                                      onClick={() => setViewingBatchId(item.batchId)}
                                    >
                                      {item.batchId}
                                    </button>
                                  ) : (
                                    'N/A'
                                  )}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                                <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: 'var(--danger)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Widget 2: Left to Return by Batch & Model */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', flex: 1, maxWidth: '550px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t.leftToReturnByBatchModel}
                      </span>
                    
                    </div>

                    <div className="quick-metrics-stack" style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '260px' }}>
                      {leftToReturnByBatchData.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                          {t.allStockReturned}
                        </div>
                      ) : (
                        leftToReturnByBatchData.slice(0, 5).map((item, idx) => {
                          const maxBalance = leftToReturnByBatchData[0]?.balance || 1;
                          const ratio = (item.balance / maxBalance) * 100;
                          const pipeName = pipeTypes.find((p) => p.id === item.pipeTypeId)?.name || 'Unknown';
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                  Batch ID:{' '}
                                  {item.batchId && item.batchId !== 'Unknown' ? (
                                    <button
                                      type="button"
                                      className="link-btn"
                                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary, var(--accent))', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600', fontSize: '0.85rem' }}
                                      onClick={() => setViewingBatchId(item.batchId)}
                                    >
                                      {item.batchId}
                                    </button>
                                  ) : (
                                    'N/A'
                                  )}
                                </span>
                                <span style={{ color: 'var(--warning)', fontWeight: '700' }}>
                                  {item.balance} {language === 'my' ? 'ကျန်' : 'left'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span>
                                  {language === 'my' ? 'မော်ဒယ်: ' : 'Model: '}<strong>{pipeName}</strong>
                                </span>
                                <span>
                                  {language === 'my' ? `အပ်နှံပြီး: ${item.returned}/${item.distributed}` : `Returned: ${item.returned}/${item.distributed}`}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                                <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: 'var(--warning)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* PRODUCTION TAB RENDER */}
          {activeTab === 'Production' && (
            <>
              {/* Reactive Search & Filters Header */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="prod-start-date">{isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}</label>
                  <input
                    id="prod-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setPage('production', 1);
                    }}
                  />
                </div>

                {!isSpecificDate && (
                  <div className="filter-group">
                    <label htmlFor="prod-end-date">{t.endDate}:</label>
                    <input
                      id="prod-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage('production', 1);
                      }}
                    />
                  </div>
                )}

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                  <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSpecificDate}
                      onChange={(e) => {
                        setIsSpecificDate(e.target.checked);
                        const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                        tables.forEach(t => setPage(t, 1));
                      }}
                    />
                    {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                  </label>
                </div>
              </div>

              <div className="table-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: 0 }}>{language === 'my' ? 'ကုန်ထုတ်လုပ်မှု မှတ်တမ်းများ' : 'Production Log Registry'}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                      {language === 'my' ? 'ဗဟိုစက်ရုံမှ ကုန်ထုတ်လုပ်မှုမှတ်တမ်းများ။' : 'Central factory production logs.'}
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder={t.searchBatchId}
                    style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                    value={searchBatchId}
                    onChange={(e) => {
                      setSearchBatchId(e.target.value);
                      setPage('production', 1);
                    }}
                  />
                </div>
                <div className="table-wrapper mobile-cards">
                  <table>
                    <thead>
                      <tr>
                        <th>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</th>
                        <th>Batch ID</th>
                        <th>Model</th>
                        <th>Output</th>
                        <th>QC Status</th>
                        {user.role === 'admin' && <th>{t.action}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(user.role === 'admin' ? 6 : 5)
                      ) : filteredProductions.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noBatchesRegistered}
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const filtered = filteredProductions;
                          return (isPrinting ? filtered : filtered.slice((getPage('production') - 1) * getPageSize('production'), getPage('production') * getPageSize('production'))).map((prod) => {
                            const pipeName = pipeTypes.find((p) => p.id === prod.pipe_type_id)?.name || 'Unknown Pipe';
                            const hasDamaged = returnsList.some((r) => r.pipe_type_id === prod.pipe_type_id && r.status === 'damaged');
                            return (
                              <tr key={prod.id}>
                                <td data-label={language === 'my' ? 'ရက်စွဲ' : 'Date'}>{prod.date}</td>
                                <td data-label="Batch ID">
                                  {prod.batch_id ? (
                                    <button
                                      type="button"
                                      className="link-btn"
                                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                      onClick={() => setViewingBatchId(prod.batch_id)}
                                    >
                                      {prod.batch_id}
                                    </button>
                                  ) : (
                                    'N/A'
                                  )}
                                  {prod.batch_id && batchStatusMap[prod.batch_id]?.isFullyReturned && (
                                    <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '0.75rem', backgroundColor: 'var(--success)', color: 'white' }}>
                                      {t.fullyReturned}
                                    </span>
                                  )}
                                </td>
                                <td data-label="Model">{pipeName}</td>
                                <td data-label="Output">{prod.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                <td data-label="QC Status">
                                  {hasDamaged ? (
                                    <span className="badge badge-warning">{t.defectReturns}</span>
                                  ) : (
                                    <span className="badge badge-success">{t.passedQcInspection}</span>
                                  )}
                                </td>
                                {user.role === 'admin' && (
                                  <td className="actions-cell">
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        type="button"
                                        className="action-btn edit"
                                        onClick={() => openEditProductionModal(prod)}
                                      >
                                        {t.edit}
                                      </button>
                                      <button
                                        type="button"
                                        className="action-btn delete"
                                        onClick={() => deleteRecord(`/api/production?id=${prod.id}`, t.confirmDeleteRecord)}
                                      >
                                        {t.delete}
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          });
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="production"
                  totalItems={filteredProductions.length}
                />
              </div>
            </>
          )}

          {/* DISTRIBUTION TAB RENDER */}
          {activeTab === 'Distribution' && (
            <>
              {/* Reactive Search & Filters Header */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="filter-village-select">{t.outpost}:</label>
                  <select
                    id="filter-village-select"
                    value={filterVillage}
                    onChange={(e) => {
                      setFilterVillage(e.target.value);
                      setPage('distribution', 1);
                    }}
                  >
                    <option value="All">{t.allVillages}</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-pipe-select">{t.pipeModel}:</label>
                  <select
                    id="filter-pipe-select"
                    value={filterPipeType}
                    onChange={(e) => {
                      setFilterPipeType(e.target.value);
                      setPage('distribution', 1);
                    }}
                  >
                    <option value="All">{t.allPipeModels}</option>
                    {pipeTypes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-batch-id-select">{t.batchIdLabel}</label>
                  <SearchableSelect
                    id="filter-batch-id-select"
                    value={filterBatchId}
                    onChange={(val) => {
                      setFilterBatchId(val);
                      setPage('distribution', 1);
                    }}
                    options={[
                      { value: 'All', label: t.allBatches },
                      ...registeredBatchesList.map((b) => ({ value: b.batchId, label: b.batchId }))
                    ]}
                    placeholder={t.allBatches}
                    language={language}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-start-date">{isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}</label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setPage('distribution', 1);
                    }}
                  />
                </div>

                {!isSpecificDate && (
                  <div className="filter-group">
                    <label htmlFor="filter-end-date">{t.endDate}:</label>
                    <input
                      id="filter-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage('distribution', 1);
                      }}
                    />
                  </div>
                )}

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                  <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSpecificDate}
                      onChange={(e) => {
                        setIsSpecificDate(e.target.checked);
                        const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                        tables.forEach(t => setPage(t, 1));
                      }}
                    />
                    {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                  </label>
                </div>
              </div>

              {/* DISTRIBUTION HISTORY TABLE */}
              <div className="table-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: 0 }}>{t.filteredDistributionLogs}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{t.listOfAllOutgoingOutpostDeliveries}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'my' ? 'ကျေးရွာ၊ Batch ID၊ မော်ဒယ်ဖြင့် ရှာဖွေရန်...' : 'Search by village, batch, model...'}
                    style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                    value={searchDistributionQuery}
                    onChange={(e) => {
                      setSearchDistributionQuery(e.target.value);
                      setPage('distribution', 1);
                    }}
                  />
                </div>
                <div className="table-wrapper mobile-cards">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Destination</th>
                        <th>Model</th>
                        <th>Batch ID</th>
                        <th>Quantity</th>
                        {user.role === 'admin' && <th>{t.action}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(user.role === 'admin' ? 6 : 5)
                      ) : filteredDistributions.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noDistributionRecords}
                          </td>
                        </tr>
                      ) : (
                        (isPrinting ? filteredDistributions : filteredDistributions.slice((getPage('distribution') - 1) * getPageSize('distribution'), getPage('distribution') * getPageSize('distribution'))).map((item) => (
                          <tr key={item.id}>
                            <td data-label={language === 'my' ? 'ရက်စွဲ' : 'Date'}>{item.date}</td>
                            <td data-label={language === 'my' ? 'ကျေးရွာ' : 'Destination'}>{item.village}</td>
                            <td data-label="Model">{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown model'}</td>
                            <td data-label="Batch ID">
                              {item.batch_id ? (
                                <button
                                  type="button"
                                  className="link-btn"
                                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                  onClick={() => setViewingBatchId(item.batch_id)}
                                >
                                  {item.batch_id}
                                </button>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'အရေအတွက်' : 'Quantity'}>{item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                            {user.role === 'admin' && (
                              <td className="actions-cell">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="action-btn edit"
                                    onClick={() => openEditDistributionModal(item)}
                                  >
                                    {t.edit}
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => deleteRecord(`/api/distribution?id=${item.id}`, t.confirmDeleteRecord)}
                                  >
                                    {t.delete}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="distribution"
                  totalItems={filteredDistributions.length}
                />
              </div>
            </>
          )}

          {/* RETURNS TAB RENDER */}
          {activeTab === 'Returns' && (
            <>
              {/* Reactive Search & Filters Header */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="return-village-filter">{t.outpost}:</label>
                  <select
                    id="return-village-filter"
                    value={filterVillage}
                    onChange={(e) => {
                      setFilterVillage(e.target.value);
                      setPage('returns', 1);
                    }}
                  >
                    <option value="All">{t.allVillages}</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-pipe-filter">{t.pipeModel}:</label>
                  <select
                    id="return-pipe-filter"
                    value={filterPipeType}
                    onChange={(e) => {
                      setFilterPipeType(e.target.value);
                      setPage('returns', 1);
                    }}
                  >
                    <option value="All">{t.allPipeModels}</option>
                    {pipeTypes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-batch-id-filter">{t.batchIdLabel}</label>
                  <SearchableSelect
                    id="return-batch-id-filter"
                    value={filterBatchId}
                    onChange={(val) => {
                      setFilterBatchId(val);
                      setPage('returns', 1);
                    }}
                    options={[
                      { value: 'All', label: t.allBatches },
                      ...registeredBatchesList.map((b) => ({ value: b.batchId, label: b.batchId }))
                    ]}
                    placeholder={t.allBatches}
                    language={language}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="return-status-filter">{t.classification}:</label>
                  <select
                    id="return-status-filter"
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage('returns', 1);
                    }}
                  >
                    <option value="All">{t.allStatuses}</option>
                    <option value="production_grade">{language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'Production Grade'}</option>
                    <option value="damaged">{language === 'my' ? 'ပျက်စီး' : 'Damaged'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-start-date">{isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}</label>
                  <input
                    id="return-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setPage('returns', 1);
                    }}
                  />
                </div>

                {!isSpecificDate && (
                  <div className="filter-group">
                    <label htmlFor="return-end-date">{t.endDate}:</label>
                    <input
                      id="return-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage('returns', 1);
                      }}
                    />
                  </div>
                )}

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                  <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSpecificDate}
                      onChange={(e) => {
                        setIsSpecificDate(e.target.checked);
                        const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                        tables.forEach(t => setPage(t, 1));
                      }}
                    />
                    {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                  </label>
                </div>
              </div>

              {/* RETURNS HISTORY TABLE */}
              <div className="table-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: 0 }}>{t.filteredReturnsLogs}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{t.listOfIncomingReturns}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'my' ? 'ကျေးရွာ၊ Batch ID၊ မော်ဒယ်ဖြင့် ရှာဖွေရန်...' : 'Search by village, batch, model...'}
                    style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                    value={searchReturnsQuery}
                    onChange={(e) => {
                      setSearchReturnsQuery(e.target.value);
                      setPage('returns', 1);
                    }}
                  />
                </div>
                <div className="table-wrapper mobile-cards">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Outpost</th>
                        <th>Model</th>
                        <th>Batch ID</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Re-buy Unit Price</th>
                        <th>Total Value</th>
                        {user.role === 'admin' && <th>{t.action}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(user.role === 'admin' ? 9 : 8)
                      ) : filteredReturns.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noReturnLogsMatch}
                          </td>
                        </tr>
                      ) : (
                        (isPrinting ? filteredReturns : filteredReturns.slice((getPage('returns') - 1) * getPageSize('returns'), getPage('returns') * getPageSize('returns'))).map((item) => (
                          <tr key={item.id}>
                            <td data-label={language === 'my' ? 'ရက်စွဲ' : 'Date'}>{item.date}</td>
                            <td data-label={language === 'my' ? 'ကျေးရွာ' : 'Outpost'}>{item.village}</td>
                            <td data-label="Model">{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown model'}</td>
                            <td data-label="Batch ID">
                              {item.batch_id ? (
                                <button
                                  type="button"
                                  className="link-btn"
                                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                  onClick={() => setViewingBatchId(item.batch_id)}
                                >
                                  {item.batch_id}
                                </button>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'အရေအတွက်' : 'Qty'}>{item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                            <td data-label="Status">
                              <span className={`badge ${item.status === 'damaged' ? 'badge-danger' : 'badge-success'}`}>
                                {item.status === 'damaged' 
                                  ? (language === 'my' ? 'ပျက်စီး' : 'DAMAGED') 
                                  : (language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'PRODUCTION GRADE')}
                              </span>
                              {item.remark && item.remark.includes('is-resent') && (
                                <span className="badge badge-info" style={{ marginLeft: '6px', backgroundColor: 'var(--primary)', color: 'white' }}>
                                  {language === 'my' ? 'ပြန်လည်ပို့ပြီး' : 'Resent'}
                                </span>
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'စျေးနှုန်း' : 'Unit Price'}>{formatCurrency(item.price || 0)}</td>
                            <td data-label={language === 'my' ? 'စုစုပေါင်း' : 'Total'}>{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                            {user.role === 'admin' && (
                              <td className="actions-cell">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {item.status === 'damaged' && (!item.remark || !item.remark.includes('is-resent')) && (
                                    <button
                                      type="button"
                                      className="action-btn edit"
                                      style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}
                                      onClick={() => handleQuickResend(item)}
                                    >
                                      {language === 'my' ? 'ပြန်လည်ပို့ဆောင်ရန်' : 'Resend'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="action-btn edit"
                                    onClick={() => openEditReturnModal(item)}
                                  >
                                    {t.edit}
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => deleteRecord(`/api/returns?id=${item.id}`, t.confirmDeleteRecord)}
                                  >
                                    {t.delete}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="returns"
                  totalItems={filteredReturns.length}
                />
              </div>
            </>
          )}

          {/* FERRY CARS TAB RENDER */}
          {activeTab === 'Ferry Cars' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="summary-card">
                  <p>{language === 'my' ? 'စုစုပေါင်း ဝင်ငွေ' : 'Total Incomes'}</p>
                  <h3 style={{ color: 'var(--success)' }}>{formatCurrency(carStats.totalIncome)}</h3>
                </div>
                <div className="summary-card">
                  <p>{language === 'my' ? 'စုစုပေါင်း အသုံးစရိတ်' : 'Total Expenses'}</p>
                  <h3 style={{ color: 'var(--danger)' }}>{formatCurrency(carStats.totalExpense)}</h3>
                </div>
                <div className="summary-card">
                  <p>{language === 'my' ? 'အသားတင် ကျန်ရှိမှု' : 'Net Balance'}</p>
                  <h3 style={{ color: carStats.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatCurrency(carStats.netBalance)}
                  </h3>
                </div>
                <div className="summary-card">
                  <p>{language === 'my' ? 'ကား စုစုပေါင်း' : 'Total Cars'}</p>
                  <h3>{cars.length}</h3>
                </div>
              </div>

              {/* Action and filter bar */}
              <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div className="filter-group">
                  <label htmlFor="ferry-car-filter">{t.selectCar}:</label>
                  <select
                    id="ferry-car-filter"
                    value={selectedCarId}
                    onChange={(e) => {
                      setSelectedCarId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                      setPage('carExpensesTable', 1);
                      setPage('carIncomesTable', 1);
                    }}
                    style={{ minWidth: '200px' }}
                  >
                    <option value="all">{t.allCars}</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.car_number}
                      </option>
                    ))}
                  </select>
                </div>
                {user?.role === 'admin' && (
                  <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        setCarForm({ carNumber: '' });
                        setActiveModal('new_car');
                      }}
                    >
                      + {t.addCar}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      style={{ backgroundColor: 'var(--success)' }}
                      onClick={() => {
                        setCarIncomeForm({
                          date: getLocalTodayDateString(),
                          carId: cars.length > 0 ? cars[0].id : 0,
                          amount: 0,
                          reason: '',
                        });
                        setActiveModal('new_car_income');
                      }}
                      disabled={cars.length === 0}
                    >
                      + {t.addIncome}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      style={{ backgroundColor: 'var(--danger)' }}
                      onClick={() => {
                        setCarExpenseForm({
                          date: getLocalTodayDateString(),
                          carId: cars.length > 0 ? cars[0].id : 0,
                          amount: 0,
                          reason: '',
                        });
                        setActiveModal('new_car_expense');
                      }}
                      disabled={cars.length === 0}
                    >
                      + {t.addExpense}
                    </button>
                  </div>
                )}
              </div>

              {/* Main content pane */}
              <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', padding: '40px', overflowY: 'auto' }}>
                
                {/* Left column - Cars List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem' }}>
                    {language === 'my' ? 'ကား စာရင်း' : 'Cars Registry'}
                  </h3>
                  
                  {carsWithBalances.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px', border: '1px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t.noCarsRegistered}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                      {carsWithBalances.map((car) => (
                        <div
                          key={car.id}
                          onClick={() => {
                            setSelectedCarId(car.id);
                            setPage('carExpensesTable', 1);
                            setPage('carIncomesTable', 1);
                          }}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: selectedCarId === car.id ? 'var(--accent)' : 'var(--border-color)',
                            backgroundColor: selectedCarId === car.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: selectedCarId === car.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {car.car_number}
                            </span>
                            {user?.role === 'admin' && (
                              <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="action-btn edit"
                                  onClick={() => {
                                    setEditingCar(car);
                                    setCarForm({ carNumber: car.car_number });
                                    setActiveModal('edit_car');
                                  }}
                                >
                                  {t.edit}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn delete"
                                  onClick={() => handleDeleteCar(car.id, car.car_number)}
                                >
                                  {t.delete}
                                </button>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div>
                              <span>{t.income}: </span>
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(car.totalIncome)}</span>
                            </div>
                            <div>
                              <span>{t.expense}: </span>
                              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(car.totalExpense)}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{t.netIncome}:</span>
                            <span style={{ fontWeight: 700, color: car.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {formatCurrency(car.netBalance)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right column - Incomes and Expenses Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* Incomes Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem' }}>
                      <span>💵 {language === 'my' ? 'ဝင်ငွေ မှတ်တမ်း' : 'Incomes Registry'}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {selectedCarId === 'all' ? `(${t.allCars})` : ''}
                      </span>
                    </h3>
                    
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>{t.date}</th>
                            <th>{t.carNumber}</th>
                            <th>{t.amount}</th>
                            <th>{t.reason}</th>
                            {user?.role === 'admin' && <th>{t.action}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCarIncomes.length === 0 ? (
                            <tr>
                              <td colSpan={user?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                                {language === 'my' ? 'ဝင်ငွေမှတ်တမ်းမရှိပါ။' : 'No income records found.'}
                              </td>
                            </tr>
                          ) : (
                            (isPrinting 
                              ? filteredCarIncomes 
                              : filteredCarIncomes.slice((getPage('carIncomesTable') - 1) * getPageSize('carIncomesTable'), getPage('carIncomesTable') * getPageSize('carIncomesTable'))
                            ).map((income) => {
                              const car = cars.find(c => c.id === income.car_id);
                              return (
                                <tr key={income.id}>
                                  <td>{income.date}</td>
                                  <td style={{ fontWeight: 600 }}>{car ? car.car_number : `ID ${income.car_id}`}</td>
                                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(income.amount)}</td>
                                  <td>{income.reason || '-'}</td>
                                  {user?.role === 'admin' && (
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          type="button"
                                          className="action-btn edit"
                                          onClick={() => {
                                            setEditingCarIncome(income);
                                            setCarIncomeForm({
                                              date: income.date,
                                              carId: income.car_id,
                                              amount: income.amount,
                                              reason: income.reason || '',
                                            });
                                            setActiveModal('edit_car_income');
                                          }}
                                        >
                                          {t.edit}
                                        </button>
                                        <button
                                          type="button"
                                          className="action-btn delete"
                                          onClick={() => handleDeleteCarIncome(income.id)}
                                        >
                                          {t.delete}
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      tableKey="carIncomesTable"
                      totalItems={filteredCarIncomes.length}
                    />
                  </div>

                  {/* Expenses Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem' }}>
                      <span>⛽ {language === 'my' ? 'အသုံးစရိတ် မှတ်တမ်း' : 'Expenses Registry'}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {selectedCarId === 'all' ? `(${t.allCars})` : ''}
                      </span>
                    </h3>

                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>{t.date}</th>
                            <th>{t.carNumber}</th>
                            <th>{t.amount}</th>
                            <th>{t.reason}</th>
                            {user?.role === 'admin' && <th>{t.action}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCarExpenses.length === 0 ? (
                            <tr>
                              <td colSpan={user?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                                {language === 'my' ? 'အသုံးစရိတ်မှတ်တမ်းမရှိပါ။' : 'No expense records found.'}
                              </td>
                            </tr>
                          ) : (
                            (isPrinting 
                              ? filteredCarExpenses 
                              : filteredCarExpenses.slice((getPage('carExpensesTable') - 1) * getPageSize('carExpensesTable'), getPage('carExpensesTable') * getPageSize('carExpensesTable'))
                            ).map((exp) => {
                              const car = cars.find(c => c.id === exp.car_id);
                              return (
                                <tr key={exp.id}>
                                  <td>{exp.date}</td>
                                  <td style={{ fontWeight: 600 }}>{car ? car.car_number : `ID ${exp.car_id}`}</td>
                                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                                  <td>{exp.reason}</td>
                                  {user?.role === 'admin' && (
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          type="button"
                                          className="action-btn edit"
                                          onClick={() => {
                                            setEditingCarExpense(exp);
                                            setCarExpenseForm({
                                              date: exp.date,
                                              carId: exp.car_id,
                                              amount: exp.amount,
                                              reason: exp.reason,
                                            });
                                            setActiveModal('edit_car_expense');
                                          }}
                                        >
                                          {t.edit}
                                        </button>
                                        <button
                                          type="button"
                                          className="action-btn delete"
                                          onClick={() => handleDeleteCarExpense(exp.id)}
                                        >
                                          {t.delete}
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      tableKey="carExpensesTable"
                      totalItems={filteredCarExpenses.length}
                    />
                  </div>

                </div>

              </div>
            </>
          )}

          {/* RECONCILIATION TAB RENDER */}
          {activeTab === 'Reconciliation' && (
            <>
              {/* Reactive Search & Filters Header */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="recon-village-select">{t.outpost}:</label>
                  <select
                    id="recon-village-select"
                    value={filterVillage}
                    onChange={(e) => {
                      setFilterVillage(e.target.value);
                      setPage('reconciliation', 1);
                    }}
                  >
                    <option value="All">{t.allVillages}</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="recon-batch-id-select">{t.batchIdLabel}</label>
                  <SearchableSelect
                    id="recon-batch-id-select"
                    value={filterBatchId}
                    onChange={(val) => {
                      setFilterBatchId(val);
                      setPage('reconciliation', 1);
                    }}
                    options={[
                      { value: 'All', label: t.allBatches },
                      ...registeredBatchesList.map((b) => ({ value: b.batchId, label: b.batchId }))
                    ]}
                    placeholder={t.allBatches}
                    language={language}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="recon-type-select">{language === 'my' ? 'မှတ်တမ်း အမျိုးအစား' : 'Record Type'}:</label>
                  <select
                    id="recon-type-select"
                    value={filterReconType}
                    onChange={(e) => {
                      setFilterReconType(e.target.value as 'All' | 'Distributions' | 'Returns');
                      setPage('reconciliation', 1);
                    }}
                  >
                    <option value="All">{language === 'my' ? 'အားလုံး' : 'All'}</option>
                    <option value="Distributions">{language === 'my' ? 'ဖြန့်ဖြူးမှုများသာ' : 'Distributions Only'}</option>
                    <option value="Returns">{language === 'my' ? 'ပြန်အပ်နှံမှုများသာ' : 'Returns Only'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="recon-start-date">{isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}</label>
                  <input
                    id="recon-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setPage('reconciliation', 1);
                    }}
                  />
                </div>

                {!isSpecificDate && (
                  <div className="filter-group">
                    <label htmlFor="recon-end-date">{t.endDate}:</label>
                    <input
                      id="recon-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage('reconciliation', 1);
                      }}
                    />
                  </div>
                )}

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                  <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSpecificDate}
                      onChange={(e) => {
                        setIsSpecificDate(e.target.checked);
                        const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                        tables.forEach(t => setPage(t, 1));
                      }}
                    />
                    {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                  </label>
                </div>
              </div>

              {/* RECONCILIATION SUMMARY TABLE */}
              <div className="table-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: 0 }}>{t.overallDistributeSummary}</h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{t.whenAndWhenReturn}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'my' ? 'ကျေးရွာ၊ Batch ID၊ မော်ဒယ်ဖြင့် ရှာဖွေရန်...' : 'Search by village, batch, model...'}
                    style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                    value={searchReconciliationQuery}
                    onChange={(e) => {
                      setSearchReconciliationQuery(e.target.value);
                      setPage('reconciliation', 1);
                    }}
                  />
                </div>
                <div className="table-wrapper mobile-cards">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.villageName}</th>
                        <th>{t.pipeModel}</th>
                        <th>Batch ID</th>
                        <th>{t.totalDistributedPipes}</th>
                        <th>{t.distributedOn}</th>
                        <th>{t.returnedDamaged}</th>
                        <th>{language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'Production Grade'}</th>
                        <th>{language === 'my' ? 'ကျန်ရှိသော အရေအတွက်' : 'Left Qty'}</th>
                        <th>{t.returnedOn}</th>
                        <th>{language === 'my' ? 'ပြန်လည်ဝယ်ယူမှု တန်ဖိုး (MMK)' : 'Re-buy Value (MMK)'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(10)
                      ) : filteredReconciliation.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noClaims}
                          </td>
                        </tr>
                      ) : (
                        (isPrinting ? filteredReconciliation : filteredReconciliation.slice((getPage('reconciliation') - 1) * getPageSize('reconciliation'), getPage('reconciliation') * getPageSize('reconciliation'))).map((item) => (
                          <tr key={item.id}>
                            <td data-label={language === 'my' ? 'ကျေးရွာ' : 'Village'}>{item.village}</td>
                            <td data-label="Model">{item.pipeName}</td>
                            <td data-label="Batch ID">
                              {item.batchId ? (
                                <button
                                  type="button"
                                  className="link-btn"
                                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                  onClick={() => setViewingBatchId(item.batchId)}
                                >
                                  {item.batchId}
                                </button>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'ဖြန့်ဖြူးပြီး' : 'Distributed'}>
                              {item.distributedQty === 0 || item.distributedQty === 'N/A'
                                ? `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                                : `${item.distributedQty} ${language === 'my' ? 'ယူနစ်' : 'units'}`}
                            </td>
                            <td data-label={language === 'my' ? 'ဖြန့်ရက်' : 'Dist Date'} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {item.distDate}
                            </td>
                            <td data-label={language === 'my' ? 'ပျက်စီး' : 'Damaged'}>
                              {item.returnedDamagedQty > 0 ? (
                                <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>
                                  {item.returnedDamagedQty} {language === 'my' ? 'ယူနစ်' : 'units'}
                                </span>
                              ) : (
                                `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'ပြန်အပ်' : 'Returned'}>{item.returnedProductionGradeQty || 0} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                            <td data-label={language === 'my' ? 'ကျန်ရှိ' : 'Left'}>
                              {item.leftQty > 0 ? (
                                <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                                  {item.leftQty} {language === 'my' ? 'ယူနစ်' : 'units'}
                                </span>
                              ) : (
                                `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                              )}
                            </td>
                            <td data-label={language === 'my' ? 'ပြန်အပ်ရက်' : 'Ret Date'} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {item.returnDate}
                            </td>
                            <td data-label={language === 'my' ? 'ပြန်ဝယ်တန်' : 'Re-buy Value'}>
                              {item.rebuyValue > 0 ? (
                                <span className="badge badge-success">
                                  {formatCurrency(item.rebuyValue)}
                                </span>
                              ) : (
                                formatCurrency(0)
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="reconciliation"
                  totalItems={filteredReconciliation.length}
                />
              </div>
            </>
          )}

          {/* FINANCE TAB RENDER */}
          {activeTab === 'Finance' && (
            <>
              {/* Financial Period Filter Control */}
              <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', margin: 0 }}>
                  <label>{t.timePeriod}:</label>
                  <div className="button-group-toggle" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'day' ? 'active' : ''}`}
                      onClick={() => {
                        setFinancePeriod('day');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setIsSpecificDate(false);
                        setPage('finRebuyProd', 1);
                        setPage('finRatio', 1);
                        setPage('finFunding', 1);
                        setPage('finCashFlow', 1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: financePeriod === 'day' ? 'var(--primary)' : 'var(--bg-primary)',
                        color: financePeriod === 'day' ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {t.today}
                    </button>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'week' ? 'active' : ''}`}
                      onClick={() => {
                        setFinancePeriod('week');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setIsSpecificDate(false);
                        setPage('finRebuyProd', 1);
                        setPage('finRatio', 1);
                        setPage('finFunding', 1);
                        setPage('finCashFlow', 1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: financePeriod === 'week' ? 'var(--primary)' : 'var(--bg-primary)',
                        color: financePeriod === 'week' ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {t.thisWeek}
                    </button>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'month' ? 'active' : ''}`}
                      onClick={() => {
                        setFinancePeriod('month');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setIsSpecificDate(false);
                        setPage('finRebuyProd', 1);
                        setPage('finRatio', 1);
                        setPage('finFunding', 1);
                        setPage('finCashFlow', 1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: financePeriod === 'month' ? 'var(--primary)' : 'var(--bg-primary)',
                        color: financePeriod === 'month' ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {t.thisMonth}
                    </button>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        setFinancePeriod('all');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setIsSpecificDate(false);
                        setPage('finRebuyProd', 1);
                        setPage('finRatio', 1);
                        setPage('finFunding', 1);
                        setPage('finCashFlow', 1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: financePeriod === 'all' ? 'var(--primary)' : 'var(--bg-primary)',
                        color: financePeriod === 'all' ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {t.allTime}
                    </button>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'custom' ? 'active' : ''}`}
                      onClick={() => {
                        setFinancePeriod('custom');
                        setPage('finRebuyProd', 1);
                        setPage('finRatio', 1);
                        setPage('finFunding', 1);
                        setPage('finCashFlow', 1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: financePeriod === 'custom' ? 'var(--primary)' : 'var(--bg-primary)',
                        color: financePeriod === 'custom' ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {language === 'my' ? 'စိတ်ကြိုက်ကာလ' : 'Custom Range'}
                    </button>
                  </div>

                  {financePeriod === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <label htmlFor="fin-start-date" style={{ fontSize: '0.85rem', margin: 0 }}>
                        {isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}
                      </label>
                      <input
                        id="fin-start-date"
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                          setFilterStartDate(e.target.value);
                          setPage('finRebuyProd', 1);
                          setPage('finRatio', 1);
                          setPage('finFunding', 1);
                          setPage('finCashFlow', 1);
                        }}
                        style={{ padding: '6px 10px', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      />
                      {!isSpecificDate && (
                        <>
                          <label htmlFor="fin-end-date" style={{ fontSize: '0.85rem', margin: 0 }}>{t.endDate}:</label>
                          <input
                            id="fin-end-date"
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                              setFilterEndDate(e.target.value);
                              setPage('finRebuyProd', 1);
                              setPage('finRatio', 1);
                              setPage('finFunding', 1);
                              setPage('finCashFlow', 1);
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                          />
                        </>
                      )}
                      <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={isSpecificDate}
                          onChange={(e) => {
                            setIsSpecificDate(e.target.checked);
                            const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                            tables.forEach(t => setPage(t, 1));
                          }}
                        />
                        {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Finance KPIs stats grid */}
              <div className="stats-grid" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <p>{t.totalRevenue}</p>
                  <h3 style={{ color: 'var(--primary)', marginTop: '8px' }}>
                    {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%' }) : formatCurrency(financeKPIs.totalRevenue)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--accent-red, #ef4444)' }}>
                  <p>{t.totalRefunds}</p>
                  <h3 style={{ color: 'var(--accent-red, #47d620ff)', marginTop: '8px' }}>
                    {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%' }) : formatCurrency(financeKPIs.totalRefunds)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: `4px solid ${financeKPIs.netProfit >= 0 ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)'}` }}>
                  <p>{t.netProfit}</p>
                  <h3 style={{ color: financeKPIs.netProfit >= 0 ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)', marginTop: '8px' }}>
                    {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%' }) : formatCurrency(financeKPIs.netProfit)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--warning, #f59e0b)' }}>
                  <p>{t.refundRate}</p>
                  <h3 style={{ color: 'var(--warning, #f59e0b)', marginTop: '8px' }}>
                    {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '40%' }) : `${financeKPIs.refundRate.toFixed(1)}%`}
                  </h3>
                </div>
              </div>

              <div className="charts-flex-row" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                {/* RE-BUY VS PRODUCTION TABLE */}
                <div className="table-panel" style={{ width: '100%' }}>
                  <h2>{t.rebuyVsProduction}</h2>
                  <p></p>
                  <div className="table-wrapper mobile-cards">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.pipeModel}</th>
                          <th>{t.productionPrice}</th>
                          <th>{t.averageRebuyPrice}</th>
                          <th>{t.priceDifference}</th>
                          <th>{t.qtyReturned}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          renderTableSkeleton(5)
                        ) : modelFinanceData.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {t.noClaims}
                            </td>
                          </tr>
                        ) : (
                          (isPrinting ? modelFinanceData : modelFinanceData.slice((getPage('finRebuyProd') - 1) * getPageSize('finRebuyProd'), getPage('finRebuyProd') * getPageSize('finRebuyProd'))).map((item) => {
                            const isPositiveDiff = item.priceDiff > 0;
                            return (
                              <tr key={item.id}>
                                <td style={{ fontWeight: '600' }}>{item.name}</td>
                                <td>{formatCurrency(item.productionPrice)}</td>
                                <td>{item.totalRetQty > 0 ? formatCurrency(item.avgRebuyPrice) : '-'}</td>
                                <td>
                                  {item.totalRetQty > 0 ? (
                                    <span style={{
                                      fontWeight: '600',
                                      color: isPositiveDiff ? 'var(--accent-red, #ef4444)' : 'var(--accent-green, #10b981)'
                                    }}>
                                      {isPositiveDiff ? '+ ' : ''}{formatCurrency(item.priceDiff)}
                                      <span style={{ fontSize: '0.75rem', marginLeft: '4px', fontWeight: 'normal' }}>
                                        {isPositiveDiff
                                          ? (language === 'my' ? 'ပိုမိုကုန်ကျ' : '')
                                          : (language === 'my' ? 'သက်သာ' : '')}
                                      </span>
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                  )}
                                </td>
                                <td>
                                  {item.totalRetQty} {language === 'my' ? 'ယူနစ်' : 'units'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    tableKey="finRebuyProd"
                    totalItems={modelFinanceData.length}
                  />
                </div>

                {/* BATCH-SPECIFIC RE-BUY & PRODUCTION RATIO TABLE */}
                <div className="table-panel" style={{ width: '100%' }}>
                  <h2>{t.batchFinanceRatio}</h2>
                  <p></p>
                  <div className="table-wrapper mobile-cards">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.batchId}</th>
                          <th>{t.pipeModel}</th>
                          <th>{t.productionPrice}</th>
                          <th>{t.averageRebuyPrice}</th>
                          <th>{t.rebuyRatio}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          renderTableSkeleton(5)
                        ) : batchFinanceData.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {t.noClaims}
                            </td>
                          </tr>
                        ) : (
                          (isPrinting ? batchFinanceData : batchFinanceData.slice((getPage('finRatio') - 1) * getPageSize('finRatio'), getPage('finRatio') * getPageSize('finRatio'))).map((item) => {
                            return (
                              <tr key={item.batchId}>
                                <td style={{ fontWeight: '600' }}>{item.batchId}</td>
                                <td>{item.modelName}</td>
                                <td>{formatCurrency(item.productionPrice)}</td>
                                <td>{item.totalRetQty > 0 ? formatCurrency(item.avgRebuyPrice) : '-'}</td>
                                <td>
                                  {item.totalRetQty > 0 && item.avgRebuyPrice >= item.productionPrice ? (
                                    <span style={{
                                      fontWeight: '600',
                                      color: 'var(--warning, #f59e0b)'
                                    }}>
                                      {item.ratio.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    tableKey="finRatio"
                    totalItems={batchFinanceData.length}
                  />
                </div>
              </div>

              <div className={user?.role === 'admin' ? 'finance-funding-grid' : ''}>
                {/* SUMMARY TABLE */}
                <div className="table-panel">
                  <h2>{language === 'my' ? 'ကျေးရွာအလိုက် ငွေကြေးစီးဆင်းမှု အနှစ်ချုပ်' : 'Outpost Funding & Repayment Summary'}</h2>
                  <p style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {language === 'my' 
                      ? 'ကုမ္ပဏီမှ ကျေးရွာများသို့ ထုတ်ပေးထားသော ရန်ပုံငွေနှင့် ပြန်လည်ပေးဆပ်မှု လက်ကျန်များကို ခြေရာခံခြင်း။'
                      : 'Track advances disbursed to outposts, repayments made to company, and remaining outstanding balances.'}
                  </p>
                  <div className="table-wrapper mobile-cards">
                    <table>
                      <thead>
                        <tr>
                          <th>{language === 'my' ? 'ကျေးရွာ' : 'Outpost Village'}</th>
                          <th>{language === 'my' ? 'ထုတ်ပေးငွေ စုစုပေါင်း' : 'Total Disbursed'}</th>
                          <th>{language === 'my' ? 'ပြန်လည်ပေးဆပ်ငွေ စုစုပေါင်း' : 'Total Repaid'}</th>
                          <th>{language === 'my' ? 'ကျန်ရှိသော လက်ကျန်' : 'Outstanding Balance'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {villages.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No outposts registered.</td>
                          </tr>
                        ) : (
                          (isPrinting ? villages : villages.slice((getPage('finFunding') - 1) * getPageSize('finFunding'), getPage('finFunding') * getPageSize('finFunding'))).map((v) => {
                             const sum = villageFundingSummaryMap[v.name] || { disbursements: 0, repayments: 0, balance: 0 };
                             return (
                               <tr key={v.id}>
                                 <td style={{ fontWeight: '600' }}>{v.name}</td>
                                 <td style={{ color: 'var(--primary)' }}>{formatCurrency(sum.disbursements)}</td>
                                 <td style={{ color: 'var(--accent-green, #b92c10ff)' }}>{formatCurrency(sum.repayments)}</td>
                                 <td>
                                   <span style={{ 
                                     fontWeight: '600', 
                                     color: sum.balance > 0 ? 'var(--warning, #f59e0b)' : 'var(--text-primary)'
                                   }}>
                                     {formatCurrency(sum.balance)}
                                   </span>
                                 </td>
                               </tr>
                             );
                           })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    tableKey="finFunding"
                    totalItems={villages.length}
                  />
                </div>

                {/* LOG FORM (Admin Only) */}
                {user.role === 'admin' && (
                  <div className="table-panel" style={{ padding: '20px' }}>
                    <h2>{language === 'my' ? 'ငွေကြေးလွှဲပြောင်းမှု မှတ်တမ်းတင်ရန်' : 'Log Cash Transaction'}</h2>
                    <form onSubmit={handleLogFundingTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</label>
                        <input 
                          type="date" 
                          required 
                          value={fundingForm.date} 
                          onChange={(e) => setFundingForm({ ...fundingForm, date: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'my' ? 'ကျေးရွာ' : 'Outpost Village'}</label>
                        <select 
                          required
                          value={fundingForm.village}
                          onChange={(e) => setFundingForm({ ...fundingForm, village: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                          <option value="">Select outpost...</option>
                          {villages.map((v) => (
                            <option key={v.id} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'my' ? 'အမျိုးအစား' : 'Transaction Type'}</label>
                        <select 
                          required
                          value={fundingForm.type}
                          onChange={(e) => setFundingForm({ ...fundingForm, type: e.target.value as any })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                          <option value="disbursement">{language === 'my' ? 'ကုမ္ပဏီမှ ကျေးရွာသို့ ထုတ်ပေးငွေ' : 'Disbursement (Company to Village)'}</option>
                          <option value="repayment">{language === 'my' ? 'ကျေးရွာမှ ကုမ္ပဏီသို့ ပြန်ဆပ်ငွေ' : 'Repayment (Village to Company)'}</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'my' ? 'ပမာဏ (MMK)' : 'Amount (MMK)'}</label>
                        <input 
                          type="number" 
                          min="1" 
                          required 
                          placeholder="e.g. 50000"
                          value={fundingForm.amount || ''}
                          onChange={(e) => setFundingForm({ ...fundingForm, amount: Number(e.target.value) })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{language === 'my' ? 'မှတ်ချက်' : 'Remarks / Reference'}</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Operation advance, Weekly settle..."
                          value={fundingForm.remark}
                          onChange={(e) => setFundingForm({ ...fundingForm, remark: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="primary" 
                        style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {isSubmitting ? 'Submitting...' : (language === 'my' ? 'သိမ်းဆည်းမည်' : 'Save Transaction')}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* TRANSACTION HISTORY LOG */}
              <div className="table-panel" style={{ width: '100%', marginBottom: '24px' }}>
                <h2>{language === 'my' ? 'ငွေကြေးစီးဆင်းမှု မှတ်တမ်း' : 'Cash Flow Ledger History'}</h2>
                
                {/* Reactive Search & Filters Header for Cash Flow */}
                <div className="filter-bar no-print" style={{ margin: '16px 0', borderRadius: '8px', padding: '16px 20px', gap: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="filter-group">
                    <label htmlFor="cf-filter-village-select">{language === 'my' ? 'ကျေးရွာ:' : 'Outpost:'}</label>
                    <select
                      id="cf-filter-village-select"
                      value={filterFundingVillage}
                      onChange={(e) => {
                        setFilterFundingVillage(e.target.value);
                        setPage('finCashFlow', 1);
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="All">{language === 'my' ? 'ကျေးရွာအားလုံး' : 'All villages'}</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="cf-filter-type-select">{language === 'my' ? 'အမျိုးအစား:' : 'Type:'}</label>
                    <select
                      id="cf-filter-type-select"
                      value={filterFundingType}
                      onChange={(e) => {
                        setFilterFundingType(e.target.value);
                        setPage('finCashFlow', 1);
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="All">{language === 'my' ? 'အားလုံး' : 'All'}</option>
                      <option value="disbursement">{language === 'my' ? 'ထုတ်ပေးငွေ' : 'Disbursement'}</option>
                      <option value="repayment">{language === 'my' ? 'ပြန်ဆပ်ငွေ' : 'Repayment'}</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="cf-filter-start-date">{language === 'my' ? 'စတင်မည့်ရက်:' : 'Start Date:'}</label>
                    <input
                      id="cf-filter-start-date"
                      type="date"
                      value={filterFundingStartDate}
                      onChange={(e) => {
                        setFilterFundingStartDate(e.target.value);
                        setPage('finCashFlow', 1);
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="filter-group">
                    <label htmlFor="cf-filter-end-date">{language === 'my' ? 'ပြီးဆုံးမည့်ရက်:' : 'End Date:'}</label>
                    <input
                      id="cf-filter-end-date"
                      type="date"
                      value={filterFundingEndDate}
                      onChange={(e) => {
                        setFilterFundingEndDate(e.target.value);
                        setPage('finCashFlow', 1);
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div className="table-wrapper mobile-cards" style={{ marginTop: '12px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</th>
                        <th>{language === 'my' ? 'ကျေးရွာ' : 'Outpost Village'}</th>
                        <th>{language === 'my' ? 'အမျိုးအစား' : 'Type'}</th>
                        <th>{language === 'my' ? 'ပမာဏ' : 'Amount'}</th>
                        <th>{language === 'my' ? 'မှတ်ချက်' : 'Remarks'}</th>
                        {user.role === 'admin' && <th>{language === 'my' ? 'လုပ်ဆောင်ချက်' : 'Action'}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(user.role === 'admin' ? 6 : 5)
                      ) : filteredFundingList.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {language === 'my' ? 'ငွေကြေးလွှဲပြောင်းမှုမှတ်တမ်း မရှိသေးပါ။' : 'No transactions recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        (isPrinting ? filteredFundingList : filteredFundingList.slice((getPage('finCashFlow') - 1) * getPageSize('finCashFlow'), getPage('finCashFlow') * getPageSize('finCashFlow'))).map((f) => (
                          <tr key={f.id}>
                            <td>{f.date}</td>
                            <td style={{ fontWeight: '600' }}>{f.village}</td>
                            <td>
                              <span className={`badge ${f.type === 'disbursement' ? 'badge-primary' : 'badge-success'}`} style={{ backgroundColor: f.type === 'disbursement' ? 'var(--primary)' : 'var(--success)', color: 'white' }}>
                                {f.type === 'disbursement' 
                                  ? (language === 'my' ? 'ကုမ္ပဏီမှ ထုတ်ပေးငွေ' : 'DISBURSEMENT') 
                                  : (language === 'my' ? 'ကျေးရွာမှ ပြန်ဆပ်ငွေ' : 'REPAYMENT')}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(f.amount)}</td>
                            <td>{f.remark || '-'}</td>
                            {user.role === 'admin' && (
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="action-btn edit"
                                    onClick={() => openEditFundingModal(f)}
                                  >
                                    {t.edit}
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => deleteFundingRecord(f.id)}
                                  >
                                    {t.delete}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="finCashFlow"
                  totalItems={filteredFundingList.length}
                />
              </div>
            </>
          )}

          {/* REPORTS TAB RENDER */}
          {activeTab === 'Reports' && (
            <div className="reports-tab-container">
              {/* Reports Filter Controls */}
              <div className="filter-bar reports-controls no-print">
                <div className="filter-group">
                  <label htmlFor="report-type">{t.reportTypeLabel}</label>
                  <select
                    id="report-type"
                    value={reportType}
                    disabled={reportType !== 'distribution_left' && filterBatchId !== 'All'}
                    onChange={(e) => {
                      setReportType(e.target.value as any);
                      setPage('repRecon', 1);
                      setPage('repProd', 1);
                      setPage('repDist', 1);
                      setPage('repRet', 1);
                    }}
                  >
                    <option value="daily">{t.daily}</option>
                    <option value="weekly">{t.weekly}</option>
                    <option value="monthly">{t.monthly}</option>
                    <option value="custom">{language === 'my' ? 'စိတ်ကြိုက်ကာလ' : 'Custom Range'}</option>
                    <option value="distribution_left">{language === 'my' ? 'ဖြန့်ဖြူးမှုနှင့် ကျန်ရှိမှု' : 'Distribution & Left Return'}</option>
                  </select>
                </div>

                {reportType === 'distribution_left' ? (
                  <>
                    <div className="filter-group">
                      <label htmlFor="report-village-select">{language === 'my' ? 'ကျေးရွာ:' : 'Outpost:'}</label>
                      <select
                        id="report-village-select"
                        value={reportVillage}
                        onChange={(e) => {
                          setReportVillage(e.target.value);
                          setPage('repRecon', 1);
                        }}
                      >
                        <option value="All">{t.allVillages}</option>
                        {villages.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-model-select">{t.pipeModel}:</label>
                      <select
                        id="report-model-select"
                        value={reportPipeTypeId}
                        onChange={(e) => {
                          setReportPipeTypeId(e.target.value);
                          setPage('repRecon', 1);
                        }}
                      >
                        <option value="All">{t.allPipeModels}</option>
                        {pipeTypes.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-batch-select">{t.batchIdLabel}</label>
                      <SearchableSelect
                        id="report-batch-select"
                        value={reportBatchId}
                        onChange={(val) => {
                          setReportBatchId(val);
                          setPage('repRecon', 1);
                        }}
                        options={[
                          { value: 'All', label: t.allBatches },
                          ...registeredBatchesList.map((b) => ({ value: b.batchId, label: b.batchId }))
                        ]}
                        placeholder={t.allBatches}
                        language={language}
                      />
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-start-date">
                        {isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}
                      </label>
                      <input
                        id="report-start-date"
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                          setFilterStartDate(e.target.value);
                          setPage('repRecon', 1);
                        }}
                      />
                    </div>

                    {!isSpecificDate && (
                      <div className="filter-group">
                        <label htmlFor="report-end-date">{t.endDate}:</label>
                        <input
                          id="report-end-date"
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            setPage('repRecon', 1);
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {reportType === 'custom' ? (
                      <>
                        <div className="filter-group">
                          <label htmlFor="report-start-date">
                            {isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}
                          </label>
                          <input
                            id="report-start-date"
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                              setFilterStartDate(e.target.value);
                              setPage('repProd', 1);
                              setPage('repDist', 1);
                              setPage('repRet', 1);
                            }}
                          />
                        </div>
                        {!isSpecificDate && (
                          <div className="filter-group">
                            <label htmlFor="report-end-date">{t.endDate}:</label>
                            <input
                              id="report-end-date"
                              type="date"
                              value={filterEndDate}
                              onChange={(e) => {
                                setFilterEndDate(e.target.value);
                                setPage('repProd', 1);
                                setPage('repDist', 1);
                                setPage('repRet', 1);
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="filter-group">
                        <label htmlFor="report-date">
                          {reportType === 'daily' && (language === 'my' ? 'ရက်စွဲ ရွေးချယ်ရန်:' : 'Select Date:')}
                          {reportType === 'weekly' && (language === 'my' ? 'စတင်မည့် ရက်စွဲ ရွေးချယ်ရန်:' : 'Select Start Date:')}
                          {reportType === 'monthly' && (language === 'my' ? 'လ ရွေးချယ်ရန်:' : 'Select Month:')}
                        </label>
                        <input
                          id="report-date"
                          type={reportType === 'monthly' ? 'month' : 'date'}
                          value={reportDate}
                          disabled={filterBatchId !== 'All'}
                          onChange={(e) => {
                            setReportDate(e.target.value);
                            setPage('repProd', 1);
                            setPage('repDist', 1);
                            setPage('repRet', 1);
                          }}
                        />
                      </div>
                    )}

                    <div className="filter-group">
                      <label htmlFor="report-batch-id-select">{t.batchIdLabel}</label>
                      <SearchableSelect
                        id="report-batch-id-select"
                        value={filterBatchId}
                        onChange={(val) => {
                          setFilterBatchId(val);
                          setPage('repProd', 1);
                          setPage('repDist', 1);
                          setPage('repRet', 1);
                        }}
                        options={[
                          { value: 'All', label: t.allBatches },
                          ...registeredBatchesList.map((b) => ({ value: b.batchId, label: b.batchId }))
                        ]}
                        placeholder={t.allBatches}
                        language={language}
                      />
                    </div>
                  </>
                )}

                {(reportType === 'custom' || reportType === 'distribution_left') && (
                  <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                    <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={isSpecificDate}
                        onChange={(e) => {
                          setIsSpecificDate(e.target.checked);
                          const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                          tables.forEach(t => setPage(t, 1));
                        }}
                      />
                      {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                    </label>
                  </div>
                )}

                <div className="responsive-btn-group right-aligned">
                  <button type="button" className="secondary" onClick={handleExportExcel}>
                    📊 {t.exportToExcelBtn}
                  </button>
                  <button type="button" className="primary" onClick={handleExportPdf}>
                    🖨️ {t.exportToPdfBtn}
                  </button>
                </div>
              </div>

              {/* REPORT CONTAINER FOR VIEW AND PRINT */}
              <div id="printable-report" className="report-content-card" style={{ padding: '40px' }}>
                {/* Print Only Header */}
                <div className="print-only-header" style={{ display: 'none', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>TRAMMELNET</h1>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Centralized Inventory Network</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>{t.reportGenerationTitle}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{language === 'my' ? 'ထုတ်ယူသည့်အချိန်:' : 'Printed on:'} {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="report-header" style={{ marginBottom: '24px' }}>
                  <h2>{t.reportGenerationTitle}</h2>
                  <p className="report-period" style={{ fontSize: '1rem', marginTop: '4px' }}>
                    {language === 'my' ? 'အစီရင်ခံစာ ကာလ:' : 'Reporting Period:'}{' '}
                    <strong style={{ color: 'var(--accent)' }}>
                      {isDataLoading ? renderSkeleton({ height: '1.25rem', width: '150px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px' }) : (reportFilterRange.label || (language === 'my' ? 'ရွေးချယ်မထားပါ' : 'Not Selected'))}
                    </strong>
                  </p>
                </div>

                {/* Period Summary Cards */}
                {reportType === 'distribution_left' ? (
                  <div className="stats-grid report-summary-grid" style={{ marginBottom: '32px', border: '1px solid var(--border-color)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'စုစုပေါင်း ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Total Distributed Units'}</p>
                      <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.distributed}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'စုစုပေါင်း ပြန်အပ်နှံပြီး အရေအတွက်' : 'Total Returned Units'}</p>
                      <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.returned}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'ပြန်အပ်ရန် ကျန်ရှိသော အရေအတွက်' : 'Left to Return to Company'}</p>
                      <h3 style={{ color: reportData.totals.balance > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.balance}
                      </h3>
                    </div>
                  </div>
                ) : (
                  <div className="stats-grid report-summary-grid" style={{ marginBottom: '32px', border: '1px solid var(--border-color)' }}>
                    <div className="summary-card">
                      <p>{t.totalProducedUnits}</p>
                      <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.produced}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.totalDistributedUnits}</p>
                      <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.distributed}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.totalReturnedUnits}</p>
                      <h3>{isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : reportData.totals.returned}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.netInventoryChange}</p>
                      <h3 style={{ color: reportData.totals.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {isDataLoading ? renderSkeleton({ height: '2.5rem', width: '60%', marginTop: '8px' }) : (
                          <>
                            {reportData.totals.balance >= 0 ? '+' : ''}
                            {reportData.totals.balance}
                          </>
                        )}
                      </h3>
                    </div>
                  </div>
                )}

                {reportType === 'distribution_left' ? (
                  !isDataLoading && reportFilteredRecon.length === 0 ? (
                    <div className="no-activity-placeholder" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📋</span>
                      <p>{language === 'my' ? 'မှတ်တမ်း မရှိပါ။' : 'No records found.'}</p>
                    </div>
                  ) : (
                    <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚚 {language === 'my' ? 'ဖြန့်ဖြူးမှုနှင့် ကျန်ရှိသောပြန်အပ်ရန် စာရင်း' : 'Distribution & Left to Return Summary'}
                      </h3>
                      <div className="table-wrapper mobile-cards">
                        <table>
                          <thead>
                            <tr>
                              <th>{t.villageName}</th>
                              <th>{t.pipeModel}</th>
                              <th>Batch ID</th>
                              <th>{language === 'my' ? 'ဖြန့်ဖြူးသည့်ရက်စွဲ' : 'Dist Date'}</th>
                              <th>{language === 'my' ? 'ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Distributed Qty'}</th>
                              <th>{language === 'my' ? 'ချို့ယွင်းချက် (Error)' : 'Returned Damaged'}</th>
                              <th>{language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'Production Grade'}</th>
                              <th>{language === 'my' ? 'ကျန်ရှိသော အရေအတွက်' : 'Left Qty'}</th>
                              <th>{language === 'my' ? 'ပြန်အပ်သည့်ရက်စွဲ' : 'Return Date'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isDataLoading ? (
                              renderTableSkeleton(9)
                            ) : (
                              (isPrinting ? reportFilteredRecon : reportFilteredRecon.slice((getPage('repRecon') - 1) * getPageSize('repRecon'), getPage('repRecon') * getPageSize('repRecon'))).map((item: any) => (
                                <tr key={item.id}>
                                  <td>{item.village}</td>
                                  <td>{item.pipeName}</td>
                                  <td>
                                    {item.batchId ? (
                                      <button
                                        type="button"
                                        className="link-btn"
                                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                        onClick={() => setViewingBatchId(item.batchId)}
                                      >
                                        {item.batchId}
                                      </button>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                  <td>{item.distDate}</td>
                                  <td>{item.distributedQty} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                  <td>
                                    {item.returnedDamagedQty > 0 ? (
                                      <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>
                                        {item.returnedDamagedQty} {language === 'my' ? 'ယူနစ်' : 'units'}
                                      </span>
                                    ) : (
                                      `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                                    )}
                                  </td>
                                  <td>{item.returnedProductionGradeQty || 0} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                  <td>
                                    {item.leftQty > 0 ? (
                                      <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                                        {item.leftQty} {language === 'my' ? 'ယူနစ်' : 'units'}
                                      </span>
                                    ) : (
                                      `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                                    )}
                                  </td>
                                  <td>{item.returnDate}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls
                        tableKey="repRecon"
                        totalItems={reportFilteredRecon.length}
                      />
                    </div>
                  )
                ) : (
                  !isDataLoading &&
                  reportData.productions.length === 0 &&
                  reportData.distributions.length === 0 &&
                  reportData.returns.length === 0 ? (
                    <div className="no-activity-placeholder" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📋</span>
                      <p>{t.noActivityPeriod}</p>
                    </div>
                  ) : (
                    <div className="report-tables-stack" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      {/* Production Summary Table */}
                      {(isDataLoading || reportData.productions.length > 0) && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🏭 {t.productionSummaryHeader}</h3>
                          <div className="table-wrapper mobile-cards">
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Batch ID</th>
                                  <th>Model</th>
                                  <th>Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {isDataLoading ? (
                                  renderTableSkeleton(4)
                                ) : (
                                  (isPrinting ? reportData.productions : reportData.productions.slice((getPage('repProd') - 1) * getPageSize('repProd'), getPage('repProd') * getPageSize('repProd'))).map((item: any) => (
                                    <tr key={item.id}>
                                      <td>{item.date}</td>
                                      <td>
                                        {item.batch_id ? (
                                          <button
                                            type="button"
                                            className="link-btn"
                                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                            onClick={() => setViewingBatchId(item.batch_id)}
                                          >
                                            {item.batch_id}
                                          </button>
                                        ) : (
                                          'N/A'
                                        )}
                                      </td>
                                      <td>{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown'}</td>
                                      <td>{item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <PaginationControls
                            tableKey="repProd"
                            totalItems={reportData.productions.length}
                          />
                        </div>
                      )}

                      {/* Distribution Summary Table */}
                      {(isDataLoading || reportData.distributions.length > 0) && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🚚 {t.distributionSummaryHeader}</h3>
                          <div className="table-wrapper mobile-cards">
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Outpost</th>
                                  <th>Model</th>
                                  <th>Batch ID</th>
                                  <th>Quantity</th>
                                  <th>Unit Price</th>
                                  <th>Total Price</th>
                                  <th>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {isDataLoading ? (
                                  renderTableSkeleton(8)
                                ) : (
                                  (isPrinting ? reportData.distributions : reportData.distributions.slice((getPage('repDist') - 1) * getPageSize('repDist'), getPage('repDist') * getPageSize('repDist'))).map((item: any) => (
                                    <tr key={item.id}>
                                      <td>{item.date}</td>
                                      <td>{item.village}</td>
                                      <td>{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown'}</td>
                                      <td>
                                        {item.batch_id ? (
                                          <button
                                            type="button"
                                            className="link-btn"
                                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                            onClick={() => setViewingBatchId(item.batch_id)}
                                          >
                                            {item.batch_id}
                                          </button>
                                        ) : (
                                          'N/A'
                                        )}
                                      </td>
                                      <td>{item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                      <td>{formatCurrency(item.price)}</td>
                                      <td>{formatCurrency(item.quantity * item.price)}</td>
                                      <td style={{ fontSize: '0.85rem' }}>{item.remark || '-'}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <PaginationControls
                            tableKey="repDist"
                            totalItems={reportData.distributions.length}
                          />
                        </div>
                      )}

                      {/* Returns Summary Table */}
                      {(isDataLoading || reportData.returns.length > 0) && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🔄 {t.returnsSummaryHeader}</h3>
                          <div className="table-wrapper mobile-cards">
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Outpost</th>
                                  <th>Model</th>
                                  <th>Batch ID</th>
                                  <th>Quantity</th>
                                  <th>Status</th>
                                  <th>Re-buy Unit Price</th>
                                  <th>Total Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {isDataLoading ? (
                                  renderTableSkeleton(8)
                                ) : (
                                  (isPrinting ? reportData.returns : reportData.returns.slice((getPage('repRet') - 1) * getPageSize('repRet'), getPage('repRet') * getPageSize('repRet'))).map((item: any) => (
                                    <tr key={item.id}>
                                      <td>{item.date}</td>
                                      <td>{item.village}</td>
                                      <td>{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown'}</td>
                                      <td>
                                        {item.batch_id ? (
                                          <button
                                            type="button"
                                            className="link-btn"
                                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                            onClick={() => setViewingBatchId(item.batch_id)}
                                          >
                                            {item.batch_id}
                                          </button>
                                        ) : (
                                          'N/A'
                                        )}
                                      </td>
                                      <td>{item.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                                      <td>
                                        <span className={`badge ${item.status === 'damaged' ? 'badge-danger' : 'badge-success'}`}>
                                          {item.status === 'damaged' 
                                            ? (language === 'my' ? 'ပျက်စီး (ကျေးရွာသို့ ပြန်ပို့)' : 'DAMAGED') 
                                            : (language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'PRODUCTION GRADE')}
                                        </span>
                                      </td>
                                      <td>{formatCurrency(item.price || 0)}</td>
                                      <td>{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <PaginationControls
                            tableKey="repRet"
                            totalItems={reportData.returns.length}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* DYNAMIC CATALOG Settings TAB RENDER */}
          {activeTab === 'Catalog Settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              
              {/* Segmented Control for Mobile */}
              <div className="mobile-only-catalog-tabs" style={{ padding: '0 20px 16px' , marginTop: '5px' }}>
                <div className="segmented-control" style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '4px',
                  width: '100%'
                }}>
                  <button
                    type="button"
                    className={`segmented-btn ${catalogSubTab === 'pipes' ? 'active' : ''}`}
                    onClick={() => setCatalogSubTab('pipes')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: 'none',
                      backgroundColor: catalogSubTab === 'pipes' ? 'var(--bg-primary)' : 'transparent',
                      color: catalogSubTab === 'pipes' ? 'var(--accent)' : 'var(--text-secondary)',
                      boxShadow: catalogSubTab === 'pipes' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🛠️</span>
                    <span>{t.centralPipesCatalog}</span>
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${catalogSubTab === 'villages' ? 'active' : ''}`}
                    onClick={() => setCatalogSubTab('villages')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: 'none',
                      backgroundColor: catalogSubTab === 'villages' ? 'var(--bg-primary)' : 'transparent',
                      color: catalogSubTab === 'villages' ? 'var(--accent)' : 'var(--text-secondary)',
                      boxShadow: catalogSubTab === 'villages' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🏡</span>
                    <span>{t.villageOutpostRegistry}</span>
                  </button>
                </div>
              </div>

              <div className="split-pane-wrapper catalog-split-pane">
                
                {/* Left Column: Pipe Models CRUD */}
                <div className={`table-panel ${catalogSubTab === 'pipes' ? 'active-panel' : 'inactive-panel'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ margin: 0 }}>{t.centralPipesCatalog}</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{t.configureStandardRates}</p>
                    </div>
                    <input
                      type="text"
                      placeholder={t.searchPipePlaceholder}
                      style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                      value={searchPipeQuery}
                      onChange={(e) => {
                        setSearchPipeQuery(e.target.value);
                        setPage('catalogPipes', 1);
                      }}
                    />
                  </div>
                  
                  <div className="table-wrapper mobile-cards">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.modelName}</th>
                          <th>{t.currentPrice}</th>
                          <th>{t.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          renderTableSkeleton(3)
                        ) : filteredPipeTypes.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              No pipe models registered in the catalog.
                            </td>
                          </tr>
                        ) : (
                          (isPrinting ? filteredPipeTypes : filteredPipeTypes.slice((getPage('catalogPipes') - 1) * getPageSize('catalogPipes'), getPage('catalogPipes') * getPageSize('catalogPipes'))).map((pipe) => (
                            <tr key={pipe.id}>
                              <td>{pipe.name}</td>
                              <td>
                                <span className="badge badge-success">
                                  {formatCurrency(pipe.unit_price)}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {user.role === 'admin' ? (
                                    <>
                                      <button
                                        type="button"
                                        className="action-btn edit"
                                        disabled={isSubmitting}
                                        onClick={() => openEditPriceModal(pipe)}
                                      >
                                         {t.editPrice}
                                      </button>
                                      <button
                                        type="button"
                                        className="action-btn delete"
                                        disabled={isSubmitting}
                                        onClick={() => handleDeletePipeType(pipe.id)}
                                      >
                                        {t.delete}
                                      </button>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.locked}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    tableKey="catalogPipes"
                    totalItems={filteredPipeTypes.length}
                  />
                </div>

                {/* Right Column: Outpost Registry CRUD */}
                <div className={`table-panel ${catalogSubTab === 'villages' ? 'active-panel' : 'inactive-panel'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ margin: 0 }}>{t.villageOutpostRegistry}</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{t.manageActiveNodes}</p>
                    </div>
                    <input
                      type="text"
                      placeholder={t.searchVillagePlaceholder}
                      style={{ width: '240px', padding: '8px 12px', fontSize: '0.85rem' }}
                      value={searchVillageQuery}
                      onChange={(e) => {
                        setSearchVillageQuery(e.target.value);
                        setPage('catalogVillages', 1);
                      }}
                    />
                  </div>

                  <div className="table-wrapper mobile-cards">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.outpostNode}</th>
                          <th>{t.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isDataLoading ? (
                          renderTableSkeleton(2)
                        ) : filteredVillages.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {t.noVillageNodesRegistered}
                            </td>
                          </tr>
                        ) : (
                          (isPrinting ? filteredVillages : filteredVillages.slice((getPage('catalogVillages') - 1) * getPageSize('catalogVillages'), getPage('catalogVillages') * getPageSize('catalogVillages'))).map((v) => (
                            <tr key={v.id}>
                              <td>{v.name}</td>
                              <td>
                                {user.role === 'admin' ? (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="action-btn edit"
                                      disabled={isSubmitting}
                                      onClick={() => openEditVillageModal(v)}
                                    >
                                      {language === 'my' ? 'ပြင်ဆင်ရန်' : 'Edit'}
                                    </button>
                                    <button
                                      type="button"
                                      className="action-btn delete"
                                      disabled={isSubmitting}
                                      onClick={() => handleDeleteVillage(v.id)}
                                    >
                                      {t.delete}
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.locked}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    tableKey="catalogVillages"
                    totalItems={filteredVillages.length}
                  />
                </div>

              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB RENDER */}
          {activeTab === 'Audit Logs' && user.role === 'admin' && (
            <>
              {/* Reactive Search & Filters Header */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label htmlFor="audit-start-date">{isSpecificDate ? (language === 'my' ? 'ရက်စွဲ:' : 'Date:') : t.startDate + ':'}</label>
                  <input
                    id="audit-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setPage('auditLogs', 1);
                    }}
                  />
                </div>

                {!isSpecificDate && (
                  <div className="filter-group">
                    <label htmlFor="audit-end-date">{t.endDate}:</label>
                    <input
                      id="audit-end-date"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setPage('auditLogs', 1);
                      }}
                    />
                  </div>
                )}

                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', margin: 'auto 0 0 0' }}>
                  <label className="specific-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isSpecificDate}
                      onChange={(e) => {
                        setIsSpecificDate(e.target.checked);
                        const tables = ['production', 'distribution', 'returns', 'reconciliation', 'finRebuyProd', 'finRatio', 'finFunding', 'finCashFlow', 'repProd', 'repDist', 'repRet', 'repRecon', 'auditLogs'];
                        tables.forEach(t => setPage(t, 1));
                      }}
                    />
                    {language === 'my' ? 'ရက်စွဲတစ်ခုတည်း' : 'Specific Date Only'}
                  </label>
                </div>
              </div>

              <div className="table-panel">
                <h2>{t.operationalSystemAuditTrail}</h2>
                <p>{t.chronologicalSecurityLogs}</p>
                <div className="table-wrapper mobile-cards">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.timestamp}</th>
                        <th>{t.actorUser}</th>
                        <th>{t.operationAction}</th>
                        <th>{t.operationalDetails}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        renderTableSkeleton(4)
                      ) : filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            {t.noAuditEntriesLogged}
                          </td>
                        </tr>
                      ) : (
                        (isPrinting ? filteredAuditLogs : filteredAuditLogs.slice((getPage('auditLogs') - 1) * getPageSize('auditLogs'), getPage('auditLogs') * getPageSize('auditLogs'))).map((log) => (
                          <tr key={log.id}>
                            <td data-label={t.timestamp} style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                              {formatAuditTimestamp(log.timestamp)}
                            </td>
                            <td data-label={t.actorUser}>{log.user_email}</td>
                            <td data-label={t.operationAction}>
                              <span className="badge badge-success" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                {log.action}
                              </span>
                            </td>
                            <td data-label={t.operationalDetails} className="details-col" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {log.details || 'None'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  tableKey="auditLogs"
                  totalItems={filteredAuditLogs.length}
                />
              </div>
            </>
          )}

          {/* BACKUP & RECOVERY TAB RENDER */}
          {activeTab === 'Backup & Recovery' && user?.role === 'admin' && (
            <div className="table-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2>{language === 'my' ? 'ဒေတာဘေ့စ် သိမ်းဆည်းခြင်းနှင့် ပြန်လည်ရယူခြင်း' : 'Database Snapshots & Data Recovery'}</h2>
                <div className="responsive-btn-group">
                  <button
                    type="button"
                    className="primary"
                    disabled={isBackupCreating || isBackupRestoring}
                    onClick={handleCreateBackup}
                  >
                    {isBackupCreating 
                      ? (language === 'my' ? 'သိမ်းဆည်းနေပါသည်...' : 'Creating Snapshot...') 
                      : (language === 'my' ? 'အသစ်သိမ်းဆည်းမည်' : 'Backup Database ')}
                  </button>
                  <label 
                    className="action-btn edit" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: isBackupRestoring ? 'not-allowed' : 'pointer',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--success, #16a34a)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      opacity: isBackupRestoring ? 0.6 : 1
                    }}
                  >
                    {isBackupRestoring 
                      ? (language === 'my' ? 'ပြန်လည်ရယူနေပါသည်...' : 'Restoring Data...') 
                      : (language === 'my' ? 'Excel Backup တင်သွင်းမည်' : 'Import Excel Backup (.xlsx)')}
                    <input
                      type="file"
                      accept=".xlsx"
                      disabled={isBackupRestoring}
                      onChange={handleImportExcelBackup}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {backupMessage && (
                <div className="alert" style={{ marginBottom: '24px' }}>
                  <span>ℹ️</span>
                  <span>{backupMessage}</span>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {language === 'my' 
                    ? 'ဤကဏ္ဍတွင် လက်ရှိ ဒေတာဘေ့စ်ရှိ ဇယားများအားလုံးကို local server တွင် သိမ်းဆည်းထားနိုင်သည်။ ဒေတာဘေ့စ် ပျက်စီးသွားပါက သို့မဟုတ် offline ဖြစ်နေပါကလည်း သိမ်းဆည်းထားပြီးသော ဖိုင်များကို Download ရယူနိုင်ပြီး Excel (.xlsx) အစီရင်ခံစာများ ထုတ်ယူနိုင်သည်။'
                    : 'Use this panel to manage database snapshot file archives saved locally on the server. Even if the Supabase database is gone or unreachable, you can still list, download raw backups, and export them directly to Excel (.xlsx) workbooks.'
                  }
                </p>
              </div>

              {/* BACKUP & RECOVERY SETTINGS */}
              <div style={{ 
                padding: '16px 20px', 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                marginBottom: '24px' 
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  ⚙️ {language === 'my' ? 'Backup လုပ်ဆောင်ချက် ဆက်တင်များ' : 'Automatic Backup Settings'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      disabled={isSavingSettings}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAutoBackupEnabled(val);
                        handleSaveBackupSettings(val, backupIntervalDays);
                      }}
                    />
                    {language === 'my' ? 'အလိုအလျောက် Backup စနစ်ကို ဖွင့်မည်' : 'Enable Automatic Backup'}
                  </label>

                  {autoBackupEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' , textWrap: 'nowrap'}}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {language === 'my' ? 'ရက်အပိုင်းအခြား:' : 'Backup Every:'}
                      </span>
                      <select
                        value={backupIntervalDays}
                        disabled={isSavingSettings}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBackupIntervalDays(val);
                          handleSaveBackupSettings(autoBackupEnabled, val);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.85rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={1}>1 {language === 'my' ? 'ရက်' : 'Day'}</option>
                        <option value={3}>3 {language === 'my' ? 'ရက်' : 'Days'}</option>
                        <option value={7}>7 {language === 'my' ? 'ရက်' : 'Days'}</option>
                        <option value={15}>15 {language === 'my' ? 'ရက်' : 'Days'}</option>
                        <option value={30}>30 {language === 'my' ? 'ရက်' : 'Days'}</option>
                      </select>
                    </div>
                  )}

                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {autoBackupEnabled 
                      ? (language === 'my' 
                          ? `(ရက်ပေါင်း ${backupIntervalDays} ပြည့်တိုင်း စနစ်က အလိုအလျောက် backup ပြုလုပ်ပေးပါမည်)` 
                          : `(System will auto-backup every ${backupIntervalDays} days when admin accesses the app)`)
                      : (language === 'my' 
                          ? '(အလိုအလျောက် Backup စနစ်ကို ပိတ်ထားသည် - Manual သာ ပြုလုပ်နိုင်သည်)' 
                          : '(Auto backup disabled - only manual backups will be created)')}
                  </span>
                </div>
              </div>

              <div className="table-wrapper mobile-cards">
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'my' ? 'ဖိုင်အမည်' : 'Backup Filename'}</th>
                      <th>{language === 'my' ? 'ဖန်တီးသည့်ရက်စွဲ' : 'Date Created'}</th>
                      <th>{language === 'my' ? 'ဖိုင်အရွယ်အစား' : 'File Size'}</th>
                      <th>{language === 'my' ? 'လုပ်ဆောင်ချက်များ' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isBackupLoading ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          {language === 'my' ? 'ဖိုင်များ ရှာဖွေနေပါသည်...' : 'Loading backup archives...'}
                        </td>
                      </tr>
                    ) : backups.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          {language === 'my' ? 'သိမ်းဆည်းထားသော Backup မရှိသေးပါ။' : 'No local backup snapshots found.'}
                        </td>
                      </tr>
                    ) : (
                      (isPrinting ? backups : backups.slice((getPage('backups') - 1) * getPageSize('backups'), getPage('backups') * getPageSize('backups'))).map((b) => (
                        <tr key={b.filename}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{b.filename}</td>
                          <td>{new Date(b.createdAt).toLocaleString()}</td>
                          <td>{(b.sizeBytes / 1024).toFixed(2)} KB</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="action-btn edit"
                                style={{ backgroundColor: 'var(--accent, #4f46e5)', color: 'white' }}
                                onClick={() => handleDownloadJson(b.filename)}
                              >
                                📥 JSON
                              </button>
                              <button
                                type="button"
                                className="action-btn edit"
                                style={{ backgroundColor: '#0d9488', color: 'white' }}
                                onClick={() => handleExportExcelBackup(b.filename)}
                              >
                                📊 Excel (.xlsx)
                              </button>
                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={() => handleDeleteBackup(b.filename)}
                              >
                                {t.delete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                tableKey="backups"
                totalItems={backups.length}
              />
            </div>
          )}
        </div>

        {/* MODAL OVERLAYS */}
        {activeModal && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className={`modal-content ${['distribution', 'edit_distribution', 'return', 'edit_return'].includes(activeModal) ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {activeModal === 'production' && t.recordCentralProduction}
                  {activeModal === 'distribution' && t.recordDistributionDelivery}
                  {activeModal === 'return' && t.processOutpostReturns}
                  {activeModal === 'new_pipe' && t.registerNewCatalogModel}
                  {activeModal === 'new_outpost' && t.registerNewOutpostNode}
                  {activeModal === 'edit_price' && t.editPriceTitle}
                  {activeModal === 'edit_production' && t.editProductionTitle}
                  {activeModal === 'edit_distribution' && t.editDistributionTitle}
                  {activeModal === 'edit_return' && t.editReturnTitle}
                  {activeModal === 'edit_funding' && (language === 'my' ? 'ငွေကြေးလွှဲပြောင်းမှု ပြင်ဆင်ရန်' : 'Edit Cash Transaction')}
                  {activeModal === 'edit_village' && (language === 'my' ? 'ကျေးရွာ အမည်ပြင်ဆင်ရန်' : 'Edit Outpost Village Name')}
                  {activeModal === 'update_profile' && t.updateProfileTitle}
                </h2>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setActiveModal(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {activeModal === 'production' && (
                  <form onSubmit={handleProductionSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.logNewProductionOutputs}
                    </p>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="production-date">{t.productionDate}</label>
                        <input
                          id="production-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={productionForm.date}
                          onChange={(event) => setProductionForm({ ...productionForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="production-pipe-type">{t.selectPipeModel}</label>
                        <SearchableSelect
                          id="production-pipe-type"
                          disabled={user.role !== 'admin'}
                          value={String(productionForm.pipeTypeId)}
                          onChange={(val) => setProductionForm({ ...productionForm, pipeTypeId: Number(val) })}
                          options={pipeTypes.map((pipe) => ({
                            value: String(pipe.id),
                            label: `${pipe.name} (${formatCurrency(pipe.unit_price)} / unit)`,
                            shortLabel: pipe.name
                          }))}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="production-quantity">{t.quantityProducedUnits}</label>
                        <input
                          id="production-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={productionForm.quantity === 0 ? '' : (productionForm.quantity || '')}
                          onChange={(event) => setProductionForm({ ...productionForm, quantity: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="production-batch">{t.productionBatchId} ({language === 'my' ? 'အလိုအလျောက်ထုတ်ပေးသည်' : 'Auto-Generated'})</label>
                        <input
                          id="production-batch"
                          type="text"
                          readOnly
                          placeholder={language === 'my' ? 'အလိုအလျောက် တွက်ချက်မည်' : 'Auto-generated batch ID'}
                          style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.8 }}
                          value={productionForm.batchId}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.saveProductionBatch}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeProduction}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'distribution' && (
                  <form onSubmit={handleDistributionSubmit}>
                    <div className="form-grid">
                      {/* Distribution Type Selection */}
                      <div className="form-group full-width">
                        <label style={{ marginBottom: '8px', display: 'block' }}>
                          {language === 'my' ? 'ဖြန့်ဖြူးမှုအမျိုးအစား' : 'Distribution Type'}
                        </label>
                        <div className="radio-group-row" style={{ display: 'flex', gap: '16px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            <input
                              type="radio"
                              name="distType"
                              value="normal"
                              checked={distType === 'normal'}
                              onChange={() => handleDistTypeChange('normal')}
                            />
                            <span>{language === 'my' ? 'ပုံမှန် ဖြန့်ဖြူးမှု (စက်ရုံလက်ကျန်)' : 'Normal Distribution (Factory Stock)'}</span>
                          </label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            <input
                              type="radio"
                              name="distType"
                              value="resend_damaged"
                              checked={distType === 'resend_damaged'}
                              onChange={() => handleDistTypeChange('resend_damaged')}
                            />
                            <span>{language === 'my' ? 'ပျက်စီးပစ္စည်း ပြန်လည်ပေးပို့ခြင်း' : 'Resend Damaged Return'}</span>
                          </label>
                        </div>
                      </div>

                      {/* Outstanding Damaged Returns Dropdown */}
                      {distType === 'resend_damaged' && (
                        <div className="form-group full-width">
                          <label htmlFor="distribution-damaged-return-id">
                            {language === 'my' ? 'ပြန်အပ်ထားသော ပျက်စီးပစ္စည်း ရွေးချယ်ရန်' : 'Select Damaged Return Record'}
                          </label>
                          <select
                            id="distribution-damaged-return-id"
                            required
                            disabled={user.role !== 'admin'}
                            value={selectedDamagedReturnId}
                            onChange={(event) => handleDamagedReturnSelect(event.target.value)}
                          >
                            <option value="">{language === 'my' ? '-- ရွေးချယ်ပါ --' : '-- Select Damaged Return --'}</option>
                            {outstandingDamagedReturns.map((ret) => {
                              const pipeType = pipeTypes.find(pt => pt.id === ret.pipe_type_id);
                              return (
                                <option key={ret.id} value={ret.id}>
                                  ID: {ret.id} - {ret.village} - {ret.batch_id} ({pipeType?.name || 'Unknown'}) - {ret.quantity} units - returned on {ret.date}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="distribution-date">{t.deliveryDate}</label>
                        <input
                          id="distribution-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={distributionForm.date}
                          onChange={(event) => setDistributionForm({ ...distributionForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-village">{t.destinationOutpost}</label>
                        <select
                          id="distribution-village"
                          disabled={user.role !== 'admin' || distType === 'resend_damaged'}
                          value={distributionForm.village}
                          onChange={(event) => setDistributionForm({ ...distributionForm, village: event.target.value })}
                        >
                          {villages.map((village) => (
                            <option key={village.id} value={village.name}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-batch-id">{language === 'my' ? 'ထုတ်လုပ်မှုအသုတ် ရွေးချယ်ရန်' : 'Select Production Batch'}</label>
                        <SearchableSelect
                          id="distribution-batch-id"
                          disabled={user.role !== 'admin' || distType === 'resend_damaged'}
                          required
                          value={distributionForm.batchId}
                          onChange={(val) => {
                            const selectedBatchId = val;
                            const selectedBatch = registeredBatchesList.find(b => b.batchId === selectedBatchId);
                            if (selectedBatch) {
                              setDistributionForm({ 
                                ...distributionForm, 
                                batchId: selectedBatchId,
                                pipeTypeId: selectedBatch.pipeTypeId,
                                price: selectedBatch.unitPrice 
                              });
                            } else {
                              setDistributionForm({ 
                                ...distributionForm, 
                                batchId: selectedBatchId,
                              });
                            }
                          }}
                          options={distType === 'resend_damaged'
                            ? (distributionForm.batchId ? [{ value: distributionForm.batchId, label: distributionForm.batchId, shortLabel: distributionForm.batchId }] : [])
                            : registeredBatchesList
                                .filter((batch) => !batchStatusMap[batch.batchId]?.isFullyReturned)
                                .map((batch) => ({
                                  value: batch.batchId,
                                  label: `${batch.batchId} (${batch.pipeName})`,
                                  shortLabel: batch.batchId,
                                }))
                          }
                          placeholder={distType === 'resend_damaged' ? (distributionForm.batchId ? distributionForm.batchId : (language === 'my' ? '-- အသုတ်မရှိပါ --' : '-- No Batch --')) : (language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --')}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-quantity">{t.quantityToDeliver}</label>
                        <input
                          id="distribution-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin' || distType === 'resend_damaged'}
                          value={distributionForm.quantity === 0 ? '' : (distributionForm.quantity || '')}
                          onChange={(event) => setDistributionForm({ ...distributionForm, quantity: Number(event.target.value) })}
                        />
                        {distType !== 'resend_damaged' && (
                          <small>{t.maximumFactoryAvailable}: {batchStockMap[distributionForm.batchId] ?? 0} {language === 'my' ? 'ယူနစ်' : 'units'}</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-price">{t.autoCalculatedUnitPrice}</label>
                        <input
                          id="distribution-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin' || distType === 'resend_damaged'}
                          value={distributionForm.price || ''}
                          onChange={(event) => setDistributionForm({ 
                            ...distributionForm, 
                            price: Number(event.target.value) 
                          })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-from">{language === 'my' ? 'စတင်သည့်နေရာ' : 'Origin Point'}</label>
                        <input
                          id="distribution-from"
                          type="text"
                          disabled={user.role !== 'admin'}
                          value={distributionForm.fromLocation}
                          onChange={(event) => setDistributionForm({ ...distributionForm, fromLocation: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-to">{language === 'my' ? 'ပေးပို့မည့်နေရာ' : 'Destination Storage'}</label>
                        <input
                          id="distribution-to"
                          type="text"
                          disabled={user.role !== 'admin'}
                          value={distributionForm.toLocation}
                          onChange={(event) => setDistributionForm({ ...distributionForm, toLocation: event.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="distribution-remark">{t.deliveryMemoRemarks}</label>
                        <textarea
                          id="distribution-remark"
                          rows={3}
                          placeholder="Log structural remarks or transport metrics..."
                          disabled={user.role !== 'admin'}
                          value={distributionForm.remark}
                          onChange={(event) => setDistributionForm({ ...distributionForm, remark: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting || availablePipeTypes.length === 0} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.authorizeDistribution}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeAuthorizations}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'return' && (
                  <form onSubmit={handleReturnSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="return-date">{t.returnDate}</label>
                        <input
                          id="return-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={returnForm.date}
                          onChange={(event) => setReturnForm({ ...returnForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-village">{t.returningOutpost}</label>
                        <select
                          id="return-village"
                          disabled={user.role !== 'admin'}
                          value={returnForm.village}
                          onChange={(event) => setReturnForm({
                            ...returnForm,
                            village: event.target.value,
                            batchId: '',
                            pipeTypeId: 0,
                            status: 'production_grade',
                            quantity: 0,
                            price: 0,
                          })}
                        >
                          {villages.map((village) => (
                            <option key={village.id} value={village.name}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-batch-id">{language === 'my' ? 'ထုတ်လုပ်မှုအသုတ် ရွေးချယ်ရန်' : 'Select Deployed Batch'}</label>
                        <SearchableSelect
                          id="return-batch-id"
                          disabled={user.role !== 'admin'}
                          required
                          value={returnForm.batchId}
                          onChange={(val) => {
                            const selectedBatchId = val;
                            const selectedBatch = deployedBatchesForSelectedVillage.find(b => b.batchId === selectedBatchId);
                            if (selectedBatch) {
                              setReturnForm({
                                ...returnForm,
                                batchId: selectedBatchId,
                                pipeTypeId: selectedBatch.pipeTypeId,
                                price: selectedBatch.unitPrice
                              });
                            } else {
                              setReturnForm({
                                ...returnForm,
                                batchId: selectedBatchId,
                              });
                            }
                          }}
                          options={deployedBatchesForSelectedVillage.map((batch) => ({
                            value: batch.batchId,
                            label: `${batch.batchId} (${batch.pipeName}) - ${batch.balance} ${language === 'my' ? 'လုံး ဖြန့်ထားသည်' : 'deployed'}`,
                            shortLabel: batch.batchId,
                          }))}
                          placeholder={language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-status">
                          {language === 'my' ? 'ပြန်အပ်နှံမှု အမျိုးအစား' : 'Return Classification'}
                        </label>
                        <select
                          id="return-status"
                          disabled={user.role !== 'admin' || hasResentItems}
                          value={returnForm.status}
                          onChange={(event) => setReturnForm({ ...returnForm, status: event.target.value as 'production_grade' | 'damaged' })}
                        >
                          <option value="production_grade">
                            {language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ (Production Grade)' : 'Production Grade (Re-buy)'}
                          </option>
                          <option value="damaged">
                            {language === 'my' ? 'ပျက်စီးပစ္စည်း (Damaged)' : 'Damaged (No Re-buy)'}
                          </option>
                        </select>
                        {hasResentItems && (
                          <small style={{ color: 'var(--success)', display: 'block', marginTop: '4px' }}>
                            {language === 'my' 
                              ? 'ပျက်စီးပစ္စည်း ပြန်လည်ပေးပို့ထားမှုရှိသောကြောင့် Production Grade အဖြစ်သာ ပြန်အပ်နိုင်ပါသည်။' 
                              : 'Outstanding resent items detected. Locked to Production Grade.'}
                          </small>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-quantity">
                          {language === 'my' ? 'ပြန်အပ်နှံမည့် အရေအတွက်' : 'Quantity to Return'}
                        </label>
                        <input
                          id="return-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={returnForm.quantity === 0 ? '' : returnForm.quantity}
                          onChange={(event) => setReturnForm({ ...returnForm, quantity: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <small style={{ fontWeight: '500' }}>
                          {t.villageBalanceCurrentlyDeployed}: {Math.max(0, selectedReturnBalance - returnForm.quantity)} {language === 'my' ? 'ယူနစ်' : 'units'}
                        </small>
                        <small style={{ color: returnForm.quantity > selectedReturnBalance ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {language === 'my' 
                            ? `စုစုပေါင်း ပြန်အပ်နှံမည့် အရေအတွက်: ${returnForm.quantity} ယူနစ်`
                            : `Total return quantity: ${returnForm.quantity} units`}
                        </small>
                      </div>

                      <div className="form-group full-width">
                        <label style={{ marginBottom: '8px', display: 'block' }}>{language === 'my' ? 'ပြန်လည်ဝယ်ယူသည့် စျေးနှုန်း သတ်မှတ်ချက်' : 'Re-buy Price Options'}</label>
                        <div className="radio-group-row">
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            <input
                              type="radio"
                              name="returnPriceMode"
                              value="plus10"
                              checked={returnPriceMode === 'plus10'}
                              onChange={() => setReturnPriceMode('plus10')}
                              disabled={returnForm.status !== 'production_grade'}
                            />
                            <span>{language === 'my' ? 'မူရင်းစျေးနှုန်း + ၁၀%' : 'Catalog Price + 10%'}</span>
                          </label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            <input
                              type="radio"
                              name="returnPriceMode"
                              value="manual"
                              checked={returnPriceMode === 'manual'}
                              onChange={() => setReturnPriceMode('manual')}
                              disabled={returnForm.status !== 'production_grade'}
                            />
                            <span>{language === 'my' ? 'ကိုယ်တိုင် ရိုက်ထည့်မည်' : 'Manual Input'}</span>
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-price">
                          {t.returnUnitPrice}{' '}
                          {returnPriceMode === 'plus10' && returnForm.status === 'production_grade' && `(Auto: 10% markup)`}
                        </label>
                        <input
                          id="return-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin' || returnForm.status !== 'production_grade' || returnPriceMode === 'plus10'}
                          style={returnPriceMode === 'plus10' || returnForm.status !== 'production_grade' ? { backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.8 } : undefined}
                          value={returnForm.status !== 'production_grade' ? 0 : (returnForm.price || '')}
                          onChange={(event) => setReturnForm({ ...returnForm, price: Number(event.target.value) })}
                        />
                        {returnForm.status !== 'production_grade' && (
                          <small style={{ color: 'var(--text-secondary)' }}>
                            {language === 'my' 
                              ? 'ပျက်စီးပစ္စည်း ပြန်အပ်နှံခြင်းအတွက် ပြန်လည်ဝယ်ယူသည့် ဈေးနှုန်းမရှိပါ။' 
                              : 'Re-buy price is not applicable for Damaged returns.'}
                          </small>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="return-remark">{t.returnClassificationDetails}</label>
                        <textarea
                          id="return-remark"
                          rows={3}
                          placeholder="Log dynamic descriptions of damage reports or repair logs..."
                          disabled={user.role !== 'admin'}
                          value={returnForm.remark}
                          onChange={(event) => setReturnForm({ ...returnForm, remark: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.confirmReturnProcessing}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeReturns}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'new_pipe' && (
                  <form onSubmit={handleAddPipeType}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? 'ကတ်တလောက်ထဲသို့ ပိုက်မော်ဒယ်အသစ်တစ်ခု ထည့်သွင်းရန် အချက်အလက်များ ဖြည့်စွက်ပါ။' : 'Enter the model details to register a new pipe model in the central catalog.'}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="form-group">
                        <label>{t.pipeModelName}</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 12-inch pipe"
                          value={newPipeName}
                          onChange={(e) => setNewPipeName(e.target.value)}
                        />
                        {newPipeName.trim() !== '' && (
                          <div style={{
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: pipeExists ? 'var(--danger, #ef4444)' : 'var(--success, #22c55e)',
                            fontWeight: '500'
                          }}>
                            <span>{pipeExists ? '⚠️' : '✅'}</span>
                            <span>{pipeExists ? t.pipeExistsMsg : t.pipeAvailableMsg}</span>
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>{t.basePricePerUnit}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="45.00"
                          value={newPipePrice}
                          onChange={(e) => setNewPipePrice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting || pipeExists}>
                      {t.addCatalogModel}
                    </button>
                  </form>
                )}

                {activeModal === 'new_outpost' && (
                  <form onSubmit={handleAddVillage}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? 'ဖြန့်ဖြူးရေးကွန်ရက်ထဲသို့ ကျေးရွာစခန်းအသစ်တစ်ခု ထည့်သွင်းရန် အမည်ဖြည့်စွက်ပါ။' : 'Enter the outpost name to register a new village node in your distribution network.'}
                    </p>
                    <div className="form-group">
                      <label>{t.outpostNode}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Village E"
                        value={newVillageName}
                        onChange={(e) => setNewVillageName(e.target.value)}
                      />
                      {newVillageName.trim() !== '' && (
                        <div style={{
                          marginTop: '8px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: villageExists ? 'var(--danger, #ef4444)' : 'var(--success, #22c55e)',
                          fontWeight: '500'
                        }}>
                          <span>{villageExists ? '⚠️' : '✅'}</span>
                          <span>{villageExists ? t.villageExistsMsg : t.villageAvailableMsg}</span>
                        </div>
                      )}
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting || villageExists}>
                      {t.addOutpostNode}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_village' && editingVillage && (
                  <form onSubmit={handleVillageEditSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? `"${editingVillage.name}" ၏ အမည်ကို ပြင်ဆင်ရန် အောက်တွင် အသစ်ဖြည့်သွင်းပါ။` : `Update the name of outpost village "${editingVillage.name}".`}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="form-group">
                        <label>{language === 'my' ? 'လက်ရှိအမည်' : 'Current Name'}</label>
                        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '500' }}>
                          {editingVillage.name}
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-village-name">{language === 'my' ? 'အမည်သစ်' : 'New Name'}</label>
                        <input
                          id="edit-village-name"
                          type="text"
                          required
                          placeholder="e.g. Village A Edited"
                          value={editVillageName}
                          onChange={(e) => setEditVillageName(e.target.value)}
                        />
                        {editVillageName.trim() !== '' && editingVillage && editVillageName.trim().toLowerCase() !== editingVillage.name.toLowerCase() && (
                          <div style={{
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: editVillageExists ? 'var(--danger, #ef4444)' : 'var(--success, #22c55e)',
                            fontWeight: '500'
                          }}>
                            <span>{editVillageExists ? '⚠️' : '✅'}</span>
                            <span>{editVillageExists ? t.villageExistsMsg : t.villageAvailableMsg}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting || editVillageExists}>
                      {language === 'my' ? 'သိမ်းဆည်းမည်' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeModal === 'update_profile' && user && (
                  <form onSubmit={handleProfileUpdate}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.updateProfileSubtitle}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="form-group">
                        <label>{t.emailAddressLabel}</label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => {
                            setProfileEmail(e.target.value);
                            setProfileEmailError(null);
                          }}
                        />
                        {profileEmailError && (
                          <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--danger, #ef4444)', fontWeight: '500' }}>
                            ⚠️ {profileEmailError}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>{t.newPasswordLabel} ({language === 'my' ? 'မပြင်ဆင်ပါက ကွက်လပ်ထားပါ' : 'leave blank to keep unchanged'})</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={profilePassword}
                          onChange={(e) => {
                            setProfilePassword(e.target.value);
                            setProfilePasswordError(null);
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.confirmPasswordLabel}</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={profileConfirmPassword}
                          disabled={!profilePassword}
                          onChange={(e) => {
                            setProfileConfirmPassword(e.target.value);
                            setProfilePasswordError(null);
                          }}
                        />
                        {profilePasswordError && (
                          <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--danger, #ef4444)', fontWeight: '500' }}>
                            ⚠️ {profilePasswordError}
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '24px' }} disabled={isSubmitting}>
                      {t.saveProfileBtn}
                    </button>
                  </form>
                )}

                {activeModal === 'new_car' && (
                  <form onSubmit={handleAddCar}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? 'ဖယ်ရီကားအသစ်မှတ်ပုံတင်ရန် ၎င်း၏ ကားနံပါတ်ကို ထည့်သွင်းပါ။' : 'Enter the car number to register a new ferry car in the network.'}
                    </p>
                    <div className="form-group">
                      <label>{t.carNumber}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. YGN 1A-1234"
                        value={carForm.carNumber}
                        onChange={(e) => setCarForm({ carNumber: e.target.value })}
                      />
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting}>
                      {t.addCar}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_car' && editingCar && (
                  <form onSubmit={handleEditCarSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? `"${editingCar.car_number}" ၏ ကားနံပါတ်ကို ပြင်ဆင်ရန် အောက်တွင် အသစ်ဖြည့်သွင်းပါ။` : `Update the car number for "${editingCar.car_number}".`}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="form-group">
                        <label>{language === 'my' ? 'လက်ရှိ ကားနံပါတ်' : 'Current Car Number'}</label>
                        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '500' }}>
                          {editingCar.car_number}
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-car-number">{language === 'my' ? 'ကားနံပါတ်အသစ်' : 'New Car Number'}</label>
                        <input
                          id="edit-car-number"
                          type="text"
                          required
                          placeholder="e.g. MDY 2B-5678"
                          value={carForm.carNumber}
                          onChange={(e) => setCarForm({ carNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting}>
                      {language === 'my' ? 'သိမ်းဆည်းမည်' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeModal === 'new_car_expense' && (
                  <form onSubmit={handleAddCarExpense}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.recordExpenseTitle}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>{t.selectCar}</label>
                        <select
                          value={carExpenseForm.carId}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, carId: Number(e.target.value) }))}
                          required
                        >
                          <option value="">-- {t.selectCar} --</option>
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.car_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t.date}</label>
                        <input
                          type="date"
                          required
                          value={carExpenseForm.date}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.amount}</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={carExpenseForm.amount || ''}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.reason}</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fuel, Engine Oil, Repair"
                          value={carExpenseForm.reason}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '24px', backgroundColor: 'var(--danger)' }} disabled={isSubmitting || !carExpenseForm.carId}>
                      {t.addExpense}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_car_expense' && editingCarExpense && (
                  <form onSubmit={handleEditCarExpenseSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.editExpenseTitle}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>{t.selectCar}</label>
                        <select
                          value={carExpenseForm.carId}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, carId: Number(e.target.value) }))}
                          required
                        >
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.car_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t.date}</label>
                        <input
                          type="date"
                          required
                          value={carExpenseForm.date}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.amount}</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={carExpenseForm.amount || ''}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.reason}</label>
                        <input
                          type="text"
                          required
                          value={carExpenseForm.reason}
                          onChange={(e) => setCarExpenseForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '24px' }} disabled={isSubmitting}>
                      {language === 'my' ? 'ပြင်ဆင်မည်' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeModal === 'new_car_income' && (
                  <form onSubmit={handleAddCarIncome}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.recordIncomeTitle}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>{t.selectCar}</label>
                        <select
                          value={carIncomeForm.carId}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, carId: Number(e.target.value) }))}
                          required
                        >
                          <option value="">-- {t.selectCar} --</option>
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.car_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t.date}</label>
                        <input
                          type="date"
                          required
                          value={carIncomeForm.date}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.amount}</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={carIncomeForm.amount || ''}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.reason}</label>
                        <input
                          type="text"
                          placeholder="e.g. Ferry trip fee, Delivery income (Optional)"
                          value={carIncomeForm.reason}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '24px', backgroundColor: 'var(--success)' }} disabled={isSubmitting || !carIncomeForm.carId}>
                      {t.addIncome}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_car_income' && editingCarIncome && (
                  <form onSubmit={handleEditCarIncomeSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {t.editIncomeTitle}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>{t.selectCar}</label>
                        <select
                          value={carIncomeForm.carId}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, carId: Number(e.target.value) }))}
                          required
                        >
                          {cars.map((car) => (
                            <option key={car.id} value={car.id}>
                              {car.car_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t.date}</label>
                        <input
                          type="date"
                          required
                          value={carIncomeForm.date}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.amount}</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={carIncomeForm.amount || ''}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t.reason}</label>
                        <input
                          type="text"
                          value={carIncomeForm.reason}
                          onChange={(e) => setCarIncomeForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '24px' }} disabled={isSubmitting}>
                      {language === 'my' ? 'ပြင်ဆင်မည်' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_price' && editingPipe && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (editPriceValue === '') return;
                    await handlePriceUpdate(editingPipe.id, Number(editPriceValue));
                    setActiveModal(null);
                    setEditingPipe(null);
                  }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? `"${editingPipe.name}" ၏ လက်ရှိအခြေခံဈေးနှုန်းအား ပြင်ဆင်ရန် ဈေးနှုန်းအသစ် သတ်မှတ်ပါ။` : `Enter the new unit price base rate for catalog model "${editingPipe.name}".`}
                    </p>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="form-group">
                        <label>{t.currentBasePrice}</label>
                        <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: '500' }}>
                          {formatCurrency(editingPipe.unit_price)}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t.newBasePrice}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="e.g. 45.00"
                          value={editPriceValue || ''}
                          onChange={(e) => setEditPriceValue(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting}>
                      {t.updatePrice}
                    </button>
                  </form>
                )}

                {activeModal === 'edit_production' && editingProduction && (
                  <form onSubmit={handleProductionEditSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? 'ကုန်ထုတ်လုပ်မှု မှတ်တမ်းအချက်အလက်များကို ပြင်ဆင်ပါ။' : 'Update the central production batch records.'}
                    </p>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="edit-production-date">{t.productionDate}</label>
                        <input
                          id="edit-production-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={editProductionForm.date}
                          onChange={(event) => setEditProductionForm({ ...editProductionForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-production-pipe-type">{t.selectPipeModel}</label>
                        <SearchableSelect
                          id="edit-production-pipe-type"
                          disabled={user.role !== 'admin'}
                          value={String(editProductionForm.pipeTypeId)}
                          onChange={(val) => setEditProductionForm({ ...editProductionForm, pipeTypeId: Number(val) })}
                          options={pipeTypes.map((pipe) => ({
                            value: String(pipe.id),
                            label: `${pipe.name} (${formatCurrency(pipe.unit_price)} / unit)`,
                            shortLabel: pipe.name
                          }))}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-production-quantity">{t.quantityProducedUnits}</label>
                        <input
                          id="edit-production-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={editProductionForm.quantity === 0 ? '' : (editProductionForm.quantity || '')}
                          onChange={(event) => setEditProductionForm({ ...editProductionForm, quantity: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-production-batch">{t.productionBatchId}</label>
                        <input
                          id="edit-production-batch"
                          type="text"
                          placeholder="e.g. BATCH-2026-X"
                          disabled={user.role !== 'admin'}
                          value={editProductionForm.batchId}
                          onChange={(event) => setEditProductionForm({ ...editProductionForm, batchId: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.save}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeProduction}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'edit_distribution' && editingDistribution && (
                  <form onSubmit={handleDistributionEditSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="edit-distribution-date">{t.deliveryDate}</label>
                        <input
                          id="edit-distribution-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.date}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-village">{t.destinationOutpost}</label>
                        <select
                          id="edit-distribution-village"
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.village}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, village: event.target.value })}
                        >
                          {villages.map((village) => (
                            <option key={village.id} value={village.name}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-batch-id">{language === 'my' ? 'ထုတ်လုပ်မှုအသုတ် ရွေးချယ်ရန်' : 'Select Production Batch'}</label>
                        <SearchableSelect
                          id="edit-distribution-batch-id"
                          disabled={user.role !== 'admin'}
                          required
                          value={editDistributionForm.batchId}
                          onChange={(val) => {
                            const selectedBatchId = val;
                            const selectedBatch = registeredBatchesList.find(b => b.batchId === selectedBatchId);
                            if (selectedBatch) {
                              setEditDistributionForm({ 
                                ...editDistributionForm, 
                                batchId: selectedBatchId,
                                pipeTypeId: selectedBatch.pipeTypeId,
                                price: selectedBatch.unitPrice 
                              });
                            } else {
                              setEditDistributionForm({ 
                                ...editDistributionForm, 
                                batchId: selectedBatchId,
                              });
                            }
                          }}
                          options={registeredBatchesList
                            .filter((batch) => !batchStatusMap[batch.batchId]?.isFullyReturned || batch.batchId === editDistributionForm.batchId)
                            .map((batch) => ({
                              value: batch.batchId,
                              label: `${batch.batchId} (${batch.pipeName}) - ${batch.availableStock} ${language === 'my' ? 'လက်ကျန်' : 'available'}`,
                              shortLabel: batch.batchId,
                            }))
                          }
                          placeholder={language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-quantity">{t.quantityToDeliver}</label>
                        <input
                          id="edit-distribution-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.quantity === 0 ? '' : (editDistributionForm.quantity || '')}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, quantity: Number(event.target.value) })}
                        />
                        <small>
                          {t.maximumFactoryAvailable}: {((batchStockMap[editDistributionForm.batchId] || 0) + (editingDistribution && editingDistribution.batch_id === editDistributionForm.batchId ? Number(editingDistribution.quantity) : 0))} {language === 'my' ? 'ယူနစ်' : 'units'}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-price">{t.autoCalculatedUnitPrice}</label>
                        <input
                          id="edit-distribution-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.price || ''}
                          onChange={(event) => setEditDistributionForm({ 
                            ...editDistributionForm, 
                            price: Number(event.target.value) 
                          })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-from">{language === 'my' ? 'စတင်သည့်နေရာ' : 'Origin Point'}</label>
                        <input
                          id="edit-distribution-from"
                          type="text"
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.fromLocation}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, fromLocation: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-distribution-to">{language === 'my' ? 'ပေးပို့မည့်နေရာ' : 'Destination Storage'}</label>
                        <input
                          id="edit-distribution-to"
                          type="text"
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.toLocation}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, toLocation: event.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="edit-distribution-remark">{t.deliveryMemoRemarks}</label>
                        <textarea
                          id="edit-distribution-remark"
                          rows={3}
                          placeholder="Log structural remarks or transport metrics..."
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.remark}
                          onChange={(event) => setEditDistributionForm({ ...editDistributionForm, remark: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.save}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeAuthorizations}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'edit_return' && editingReturn && (
                  <form onSubmit={handleReturnEditSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="edit-return-date">{t.returnDate}</label>
                        <input
                          id="edit-return-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={editReturnForm.date}
                          onChange={(event) => setEditReturnForm({ ...editReturnForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-return-village">{t.returningOutpost}</label>
                        <select
                          id="edit-return-village"
                          disabled={user.role !== 'admin'}
                          value={editReturnForm.village}
                          onChange={(event) => setEditReturnForm({ ...editReturnForm, village: event.target.value })}
                        >
                          {villages.map((village) => (
                            <option key={village.id} value={village.name}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-return-batch-id">{language === 'my' ? 'ထုတ်လုပ်မှုအသုတ် ရွေးချယ်ရန်' : 'Select Deployed Batch'}</label>
                        <SearchableSelect
                          id="edit-return-batch-id"
                          disabled={user.role !== 'admin'}
                          required
                          value={editReturnForm.batchId}
                          onChange={(val) => {
                            const selectedBatchId = val;
                            const selectedBatch = deployedBatchesForEditVillage.find(b => b.batchId === selectedBatchId);
                            if (selectedBatch) {
                              setEditReturnForm({
                                ...editReturnForm,
                                batchId: selectedBatchId,
                                pipeTypeId: selectedBatch.pipeTypeId,
                                price: editReturnForm.status === 'production_grade' ? selectedBatch.unitPrice : 0
                              });
                            } else {
                              setEditReturnForm({
                                ...editReturnForm,
                                batchId: selectedBatchId,
                              });
                            }
                          }}
                          options={deployedBatchesForEditVillage.map((batch) => ({
                            value: batch.batchId,
                            label: `${batch.batchId} (${batch.pipeName}) - ${batch.balance} ${language === 'my' ? 'လုံး ဖြန့်ထားသည်' : 'deployed'}`,
                            shortLabel: batch.batchId,
                          }))}
                          placeholder={language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}
                          language={language}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-return-quantity">{t.quantityToReturn}</label>
                        <input
                          id="edit-return-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={editReturnForm.quantity === 0 ? '' : (editReturnForm.quantity || '')}
                          onChange={(event) => setEditReturnForm({ ...editReturnForm, quantity: Number(event.target.value) })}
                        />
                        <small>
                          {t.villageBalanceCurrentlyDeployed}: {Math.max(0, ((villageBatchBalanceMap[editReturnForm.village]?.[editReturnForm.batchId] || 0) + (editingReturn && editingReturn.village === editReturnForm.village && editingReturn.batch_id === editReturnForm.batchId ? Number(editingReturn.quantity) : 0)) - (editReturnForm.quantity || 0))} {language === 'my' ? 'ယူနစ်' : 'units'}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-return-status">{t.inventoryClassification}</label>
                        <select
                          id="edit-return-status"
                          disabled={user.role !== 'admin' || editReturnHasResent}
                          value={editReturnForm.status}
                          onChange={(event) => {
                            const newStatus = event.target.value as 'damaged' | 'production_grade';
                            const selectedBatch = deployedBatchesForEditVillage.find(b => b.batchId === editReturnForm.batchId);
                            const standardPrice = selectedBatch ? selectedBatch.unitPrice : 0;
                            setEditReturnForm({
                              ...editReturnForm,
                              status: newStatus,
                              price: newStatus === 'production_grade' ? standardPrice : 0
                            });
                          }}
                        >
                          <option value="production_grade">{t.productionGrade}</option>
                          <option value="damaged">{t.damagedScrapped}</option>
                        </select>
                        {editReturnHasResent && (
                          <small style={{ color: 'var(--success)', display: 'block', marginTop: '4px' }}>
                            {language === 'my' 
                              ? 'ပျက်စီးပစ္စည်း ပြန်လည်ပေးပို့ထားမှုရှိသောကြောင့် Production Grade အဖြစ်သာ ပြင်ဆင်နိုင်ပါသည်။' 
                              : 'Outstanding resent items detected. Locked to Production Grade.'}
                          </small>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-return-price">{t.returnUnitPrice}</label>
                        <input
                          id="edit-return-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin' || editReturnForm.status === 'damaged'}
                          value={editReturnForm.status === 'damaged' ? 0 : (editReturnForm.price || '')}
                          onChange={(event) => setEditReturnForm({ ...editReturnForm, price: Number(event.target.value) })}
                        />
                        {editReturnForm.status === 'damaged' && (
                          <small style={{ color: 'var(--danger)' }}>
                            {language === 'my' 
                              ? 'ပျက်စီးပစ္စည်းများအတွက် ဈေးနှုန်းထည့်ရန်မလိုပါ။ ဤပစ္စည်းများကို ကျေးရွာသို့ ပြန်လည်ပေးပို့ပါမည်။' 
                              : 'No price required for damaged items. These will be returned back to the village.'}
                          </small>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="edit-return-remark">{t.returnClassificationDetails}</label>
                        <textarea
                          id="edit-return-remark"
                          rows={3}
                          placeholder="Log dynamic descriptions of damage reports or repair logs..."
                          disabled={user.role !== 'admin'}
                          value={editReturnForm.remark}
                          onChange={(event) => setEditReturnForm({ ...editReturnForm, remark: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? t.saving : t.save}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {t.viewOnlyModeReturns}
                      </div>
                    )}
                  </form>
                )}

                {activeModal === 'edit_funding' && editingFunding && (
                  <form onSubmit={handleFundingEditSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      {language === 'my' ? 'ငွေကြေးလွှဲပြောင်းမှုမှတ်တမ်း အချက်အလက်များကို ပြင်ဆင်ပါ။' : 'Update the cash transaction details.'}
                    </p>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="edit-funding-date">{language === 'my' ? 'ရက်စွဲ' : 'Date'}</label>
                        <input
                          id="edit-funding-date"
                          type="date"
                          required
                          disabled={user.role !== 'admin'}
                          value={editFundingForm.date}
                          onChange={(event) => setEditFundingForm({ ...editFundingForm, date: event.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-funding-village">{language === 'my' ? 'ကျေးရွာ' : 'Outpost Village'}</label>
                        <select
                          id="edit-funding-village"
                          disabled={user.role !== 'admin'}
                          value={editFundingForm.village}
                          onChange={(event) => setEditFundingForm({ ...editFundingForm, village: event.target.value })}
                        >
                          {villages.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-funding-type">{language === 'my' ? 'အမျိုးအစား' : 'Transaction Type'}</label>
                        <select
                          id="edit-funding-type"
                          disabled={user.role !== 'admin'}
                          value={editFundingForm.type}
                          onChange={(event) => setEditFundingForm({ ...editFundingForm, type: event.target.value as any })}
                        >
                          <option value="disbursement">{language === 'my' ? 'ကုမ္ပဏီမှ ကျေးရွာသို့ ထုတ်ပေးငွေ' : 'Disbursement (Company to Village)'}</option>
                          <option value="repayment">{language === 'my' ? 'ကျေးရွာမှ ကုမ္ပဏီသို့ ပြန်ဆပ်ငွေ' : 'Repayment (Village to Company)'}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-funding-amount">{language === 'my' ? 'ပမာဏ (MMK)' : 'Amount (MMK)'}</label>
                        <input
                          id="edit-funding-amount"
                          type="number"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={editFundingForm.amount === 0 ? '' : (editFundingForm.amount || '')}
                          onChange={(event) => setEditFundingForm({ ...editFundingForm, amount: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-funding-remark">{language === 'my' ? 'မှတ်ချက်' : 'Remarks / Reference'}</label>
                        <input
                          id="edit-funding-remark"
                          type="text"
                          disabled={user.role !== 'admin'}
                          value={editFundingForm.remark}
                          onChange={(event) => setEditFundingForm({ ...editFundingForm, remark: event.target.value })}
                        />
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <button className="primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px' }}>
                        {isSubmitting ? (language === 'my' ? 'သိမ်းဆည်းနေပါသည်...' : 'Saving...') : (language === 'my' ? 'သိမ်းဆည်းမည်' : 'Save Transaction')}
                      </button>
                    ) : (
                      <div className="notification-item alert-info" style={{ marginTop: '16px' }}>
                        {language === 'my' ? 'ဖတ်ရန်သာ (ပြင်ဆင်ခွင့်မရှိပါ)' : 'View only mode (No edit permission)'}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {viewingBatchId && viewingBatchDetails && (
          <div className="modal-overlay" onClick={() => setViewingBatchId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ margin: 0 }}>
                    {language === 'my' 
                      ? `အသုတ် အချက်အလက် - ${viewingBatchId}` 
                      : `Batch Details - ${viewingBatchId}`}
                  </h2>
                  <button
                    type="button"
                    className="secondary no-print"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}
                    onClick={handleExportBatchPdf}
                  >
                    🖨️ {language === 'my' ? 'PDF ထုတ်ယူရန်' : 'Export PDF'}
                  </button>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setViewingBatchId(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="metrics-card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'my' ? 'ပိုက် အမျိုးအစား' : 'Pipe Model'}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{viewingBatchDetails.modelName}</div>
                  </div>
                  <div className="metrics-card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'my' ? 'ထုတ်လုပ်ပြီး အရေအတွက်' : 'Total Produced'}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{viewingBatchDetails.summary.produced} {language === 'my' ? 'လုံး' : 'units'}</div>
                  </div>
                  <div className="metrics-card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'my' ? 'ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Total Distributed'}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{viewingBatchDetails.summary.distributed} {language === 'my' ? 'လုံး' : 'units'}</div>
                  </div>
                  <div className="metrics-card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'my' ? 'ပြန်အပ်နှံပြီး (အဆင့်မီ / ပျက်စီး)' : 'Returned (Grade / Damaged)'}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                      {viewingBatchDetails.summary.returnedProdGrade} / {viewingBatchDetails.summary.returnedDamaged} {language === 'my' ? 'လုံး' : 'units'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {language === 'my' ? '၁။ ထုတ်လုပ်မှု အချက်အလက်' : '1. Production Record'}
                  </h3>
                  {viewingBatchDetails.productions.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ထုတ်လုပ်မှု မှတ်တမ်း မရှိပါ။' : 'No production records found.'}</p>
                  ) : (
                    <>
                      <div className="table-wrapper mobile-cards">
                        <table>
                          <thead>
                            <tr>
                              <th>{language === 'my' ? 'ထုတ်လုပ်သည့် ရက်စွဲ' : 'Production Date'}</th>
                              <th>{language === 'my' ? 'အရေအတွက်' : 'Quantity'}</th>
                              <th>{language === 'my' ? 'အခြေခံဈေးနှုန်း' : 'Base Price'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isPrinting ? viewingBatchDetails.productions : viewingBatchDetails.productions.slice((getPage('modalProd') - 1) * getPageSize('modalProd'), getPage('modalProd') * getPageSize('modalProd'))).map((p) => (
                              <tr key={p.id}>
                                <td>{p.date}</td>
                                <td>{p.quantity} {language === 'my' ? 'လုံး' : 'units'}</td>
                                <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls
                        tableKey="modalProd"
                        totalItems={viewingBatchDetails.productions.length}
                      />
                    </>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {language === 'my' ? '၂။ ဖြန့်ဖြူးမှု သမိုင်းကြောင်း (ဘယ်သူ့ဆီ / ဘယ်နေရာ)' : '2. Distribution History (When & Where)'}
                  </h3>
                  {viewingBatchDetails.distributions.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ဖြန့်ဖြူးမှု မှတ်တမ်း မရှိပါ။' : 'No distribution records found.'}</p>
                  ) : (
                    <>
                      <div className="table-wrapper mobile-cards">
                        <table>
                          <thead>
                            <tr>
                              <th>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</th>
                              <th>{language === 'my' ? 'ကျေးရွာ' : 'Outpost / Destination'}</th>
                              <th>{language === 'my' ? 'မှ - သို့ (တည်နေရာ)' : 'From - To (Location)'}</th>
                              <th>{language === 'my' ? 'အရေအတွက်' : 'Quantity'}</th>
                              <th>{language === 'my' ? 'ဖြန့်ဖြူးဈေးနှုန်း' : 'Price'}</th>
                              <th>{language === 'my' ? 'မှတ်ချက်' : 'Remarks'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isPrinting ? viewingBatchDetails.distributions : viewingBatchDetails.distributions.slice((getPage('modalDist') - 1) * getPageSize('modalDist'), getPage('modalDist') * getPageSize('modalDist'))).map((d) => (
                              <tr key={d.id}>
                                <td>{d.date}</td>
                                <td>{d.village}</td>
                                <td>{d.from_location || 'Factory'} &rarr; {d.to_location || 'Village Store'}</td>
                                <td>{d.quantity} {language === 'my' ? 'လုံး' : 'units'}</td>
                                <td>{formatCurrency(d.price)}</td>
                                <td style={{ fontSize: '0.85rem' }}>{d.remark || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls
                        tableKey="modalDist"
                        totalItems={viewingBatchDetails.distributions.length}
                      />
                    </>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {language === 'my' ? '၃။ ပြန်လည်အပ်နှံမှု အသေးစိတ်' : '3. Returns Breakdown'}
                  </h3>
                  {viewingBatchDetails.returns.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ပြန်လည်အပ်နှံမှု မှတ်တမ်း မရှိပါ။' : 'No return records found.'}</p>
                  ) : (
                    <>
                      <div className="table-wrapper mobile-cards">
                        <table>
                          <thead>
                            <tr>
                              <th>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</th>
                              <th>{language === 'my' ? 'ကျေးရွာ' : 'Outpost'}</th>
                              <th>{language === 'my' ? 'အမျိုးအစား' : 'Classification'}</th>
                              <th>{language === 'my' ? 'အရေအတွက်' : 'Quantity'}</th>
                              <th>{language === 'my' ? 'ဝယ်ယူသည့်ဈေးနှုန်း' : 'Re-buy Price'}</th>
                              <th>{language === 'my' ? 'မှတ်ချက်' : 'Remarks'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isPrinting ? viewingBatchDetails.returns : viewingBatchDetails.returns.slice((getPage('modalRet') - 1) * getPageSize('modalRet'), getPage('modalRet') * getPageSize('modalRet'))).map((r) => (
                              <tr key={r.id}>
                                <td>{r.date}</td>
                                <td>{r.village}</td>
                                <td>
                                  <span className={`badge ${r.status === 'damaged' ? 'badge-danger' : 'badge-success'}`}>
                                    {r.status === 'damaged' 
                                      ? (language === 'my' ? 'ပျက်စီး' : 'DAMAGED') 
                                      : (language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'PRODUCTION GRADE')}
                                  </span>
                                </td>
                                <td>{r.quantity} {language === 'my' ? 'လုံး' : 'units'}</td>
                                <td>{r.status === 'damaged' ? '-' : formatCurrency(r.price || 0)}</td>
                                <td style={{ fontSize: '0.85rem' }}>{r.remark || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls
                        tableKey="modalRet"
                        totalItems={viewingBatchDetails.returns.length}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', textAlign: 'right' }}>
                <button type="button" className="secondary" onClick={() => setViewingBatchId(null)}>
                  {language === 'my' ? 'ပိတ်ရန်' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        {[
          { tab: 'Overview', icon: '📊', label: language === 'my' ? 'ခြုံငုံ' : 'Overview' },
          { tab: 'Distribution', icon: '🚚', label: language === 'my' ? 'ဖြန့်ဖြူး' : 'Distribute' },
          { tab: 'Returns', icon: '🔄', label: language === 'my' ? 'ပြန်အပ်' : 'Returns' },
          { tab: 'Reconciliation', icon: '⚖️', label: language === 'my' ? 'မှတ်တမ်း' : 'Records' },
          { tab: '__more__', icon: '☰', label: language === 'my' ? 'ထပ်ကြည့်' : 'More' },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            className={`bottom-nav-item ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => {
              if (item.tab === '__more__') {
                setIsSidebarOpen(true);
              } else {
                router.push(`?tab=${encodeURIComponent(item.tab)}`);
              }
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
