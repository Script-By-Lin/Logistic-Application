'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  DistributionRecord,
  PipeType,
  ProductionRecord,
  ReturnRecord,
} from '@/types';

// Dynamic sidebar tabs depending on user role
const ADMIN_TABS = ['Overview', 'Production', 'Distribution', 'Returns', 'Reconciliation', 'Reports', 'Finance', 'Catalog Settings', 'Audit Logs'] as const;
const VIEWER_TABS = ['Overview', 'Distribution', 'Returns', 'Reconciliation', 'Finance', 'Reports'] as const;

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
    startDate: 'Start Date',
    endDate: 'End Date',
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
    centralPipesCatalog: 'Central Pipes Catalog',
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
    villageOutpostRegistry: 'Village Outpost Registry',
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
    newOutpostNode: 'New Outpost Node',
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

function sumQuantity(records: { quantity: number }[]) {
  return records.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
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

  // --- Sidebar & Data Tabs ---
  const sidebarTabs = user?.role === 'admin' ? ADMIN_TABS : VIEWER_TABS;
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  // --- Inventory, Outpost & Log Data States ---
  const [pipeTypes, setPipeTypes] = useState<PipeType[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<'production' | 'distribution' | 'return' | 'new_pipe' | 'new_outpost' | 'edit_price' | 'edit_production' | 'edit_distribution' | 'edit_return' | null>(null);
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

  const openEditPriceModal = (pipe: PipeType) => {
    setEditingPipe(pipe);
    setEditPriceValue(pipe.unit_price);
    setActiveModal('edit_price');
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
    await submitEditForm('/api/returns', {
      id: editReturnForm.id,
      date: editReturnForm.date,
      village: editReturnForm.village,
      batchId: editReturnForm.batchId,
      quantity: editReturnForm.quantity,
      status: editReturnForm.status,
      price: editReturnForm.price,
      remark: editReturnForm.remark,
    }, () => {
      setActiveModal(null);
      setEditingReturn(null);
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
  const [filterStatus, setFilterStatus] = useState('All'); // For returns
  const [searchBatchId, setSearchBatchId] = useState(''); // For production QC search
  const [filterBatchId, setFilterBatchId] = useState('All');
  const [financePeriod, setFinancePeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');

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

  const [returnForm, setReturnForm] = useState({
    date: '',
    village: '',
    pipeTypeId: 0,
    qtyProductionGrade: 0,
    qtyDamaged: 0,
    price: 0,
    remark: '',
    batchId: '',
  });

  const [priceForm, setPriceForm] = useState({
    pipeTypeId: 0,
    unitPrice: 0,
  });

  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'distribution_left'>('daily');
  const [reportDate, setReportDate] = useState('');
  const [reportVillage, setReportVillage] = useState<string>('All');
  const [reportPipeTypeId, setReportPipeTypeId] = useState<string>('All');
  const [reportBatchId, setReportBatchId] = useState<string>('All');

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
  };

  const PAGE_SUBHEADINGS: Record<string, Record<'en' | 'my', string>> = {
  
    'Audit Logs': {
      en: 'Audit record of all creations, price updates, and distribution authorizations.',
      my: 'ထုတ်လုပ်မှုများ၊ ဈေးနှုန်းပြင်ဆင်မှုများနှင့် ဖြန့်ဖြူးမှုအတည်ပြုချက်များ၏ လုံခြုံရေးမှတ်တမ်း။',
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
            qtyProductionGrade: 0,
            qtyDamaged: 0,
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

  // Reload data when user logs in successfully
  useEffect(() => {
    if (user) {
      loadData();
      loadVillages();
      if (user.role === 'admin') {
        loadAuditLogs();
      }
    }
  }, [user]);

  // Set form dates dynamically on client-mount to prevent hydration mismatches
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setProductionForm((prev) => ({ ...prev, date: today }));
    setDistributionForm((prev) => ({ ...prev, date: today }));
    setReturnForm((prev) => ({ ...prev, date: today }));
    setReportDate(today);
  }, []);

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
      totals[distribution.pipe_type_id] =
        (totals[distribution.pipe_type_id] || 0) - Number(distribution.quantity || 0);
    });

    returnsList.forEach((returnRecord) => {
      totals[returnRecord.pipe_type_id] =
        (totals[returnRecord.pipe_type_id] || 0) + Number(returnRecord.quantity || 0);
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
      if (dist.batch_id) {
        totals[dist.batch_id] = (totals[dist.batch_id] || 0) - Number(dist.quantity || 0);
      }
    });

    returnsList.forEach((ret) => {
      if (ret.batch_id) {
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
      if (d.batch_id) {
        distTotals[d.batch_id] = (distTotals[d.batch_id] || 0) + Number(d.quantity || 0);
      }
    });

    returnsList.forEach((r) => {
      if (r.batch_id) {
        retTotals[r.batch_id] = (retTotals[r.batch_id] || 0) + Number(r.quantity || 0);
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
    const totalDistributed = batchDistributions.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
    const totalReturnedDamaged = batchReturns
      .filter(r => r.status === 'damaged')
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const totalReturnedProdGrade = batchReturns
      .filter(r => r.status === 'production_grade')
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
  const totalStock = Object.values(factoryStockMap).reduce((sum, quantity) => sum + quantity, 0);
  const totalProduction = sumQuantity(productions);
  const totalDistributed = sumQuantity(distributions);
  const totalReturned = sumQuantity(returnsList);
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
      return matchVillage && matchBatchId;
    });
  }, [reconciliationLedger, filterVillage, filterBatchId]);

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
      const batchId = d.batch_id || 'Unknown';
      const pipeTypeId = d.pipe_type_id;
      const key = `${batchId}_${pipeTypeId}`;
      if (!groups[key]) {
        groups[key] = { batchId, pipeTypeId, distributed: 0, returned: 0, balance: 0 };
      }
      groups[key].distributed += Number(d.quantity || 0);
    });
    returnsList.forEach((r) => {
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
    distributions.forEach(d => datesSet.add(d.date));
    returnsList.forEach(r => datesSet.add(r.date));
    const sortedDates = Array.from(datesSet).sort().slice(-8);
    return sortedDates.map((dateStr) => {
      const prodQty = productions.filter(p => p.date === dateStr).reduce((s, p) => s + Number(p.quantity || 0), 0);
      const distQty = distributions.filter(d => d.date === dateStr).reduce((s, d) => s + Number(d.quantity || 0), 0);
      const retQty = returnsList.filter(r => r.date === dateStr).reduce((s, r) => s + Number(r.quantity || 0), 0);
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
      const matchDate = !reportDate || item.distDate === reportDate;

      return matchVillage && matchBatch && matchPipe && matchDate;
    });
  }, [reportType, reconciliationLedger, reportVillage, reportBatchId, reportPipeTypeId, reportDate, pipeTypes]);

  const reportFilterRange = useMemo(() => {
    if (reportType === 'distribution_left') {
      const villageLabel = reportVillage === 'All' ? (language === 'my' ? 'ကျေးရွာအားလုံး' : 'All Villages') : reportVillage;
      const modelLabel = reportPipeTypeId === 'All' 
        ? (language === 'my' ? 'မော်ဒယ်အားလုံး' : 'All Models') 
        : (pipeTypes.find(p => p.id === Number(reportPipeTypeId))?.name || 'Unknown');
      const batchLabel = reportBatchId === 'All' ? (language === 'my' ? 'အသုတ်အားလုံး' : 'All Batches') : reportBatchId;
      const dateLabel = reportDate || (language === 'my' ? 'ရက်စွဲအားလုံး' : 'All Dates');
      
      return {
        start: '',
        end: '',
        label: `${language === 'my' ? 'ကျေးရွာ' : 'Village'}: ${villageLabel} | ${language === 'my' ? 'မော်ဒယ်' : 'Model'}: ${modelLabel} | Batch: ${batchLabel} | ${language === 'my' ? 'ရက်စွဲ' : 'Date'}: ${dateLabel}`,
      };
    }
    if (filterBatchId !== 'All') {
      return {
        start: '',
        end: '',
        label: `${t.batchReportLabel} ${filterBatchId}`,
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
  }, [reportType, reportDate, filterBatchId, language, t.batchReportLabel, reportVillage, reportPipeTypeId, reportBatchId, pipeTypes]);

  const reportData = useMemo(() => {
    if (reportType === 'distribution_left') {
      let distributed = 0;
      let returned = 0;
      const countedDistIds = new Set<string>();
      
      reportFilteredRecon.forEach((item) => {
        const distKey = item.id.split('-r')[0].split('-none')[0];
        if (!countedDistIds.has(distKey)) {
          countedDistIds.add(distKey);
          distributed += Number(item.distributedQty || 0);
        }
        returned += Number(item.returnedDamagedQty || 0) + Number(item.returnedProductionGradeQty || 0);
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

    const produced = sumQuantity(filteredProds);
    const distributed = sumQuantity(filteredDists);
    const returned = sumQuantity(filteredRets);

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
    if (reportType === 'distribution_left') {
      let csvContent = '\uFEFF';
      const { label } = reportFilterRange;

      csvContent += `PipeFlow Village Distribution & Left Return Report\n`;
      csvContent += `Filters: ${label}\n`;
      csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;

      csvContent += `Summary Metrics\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `"${language === 'my' ? 'စုစုပေါင်း ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Total Distributed Units'}",${reportData.totals.distributed}\n`;
      csvContent += `"${language === 'my' ? 'စုစုပေါင်း ပြန်အပ်နှံပြီး အရေအတွက်' : 'Total Returned Units'}",${reportData.totals.returned}\n`;
      csvContent += `"${language === 'my' ? 'ပြန်အပ်ရန် ကျန်ရှိသော အရေအတွက်' : 'Left to Return'}",${reportData.totals.balance}\n\n`;

      csvContent += `Distribution & Left to Return Details\n`;
      csvContent += `Village Outpost,Pipe Model,Batch ID,Dist Date,Distributed Qty,Returned Damaged,Production Grade,Left Qty,Return Date\n`;
      reportFilteredRecon.forEach((item: any) => {
        csvContent += `"${item.village}","${item.pipeName}","${item.batchId || ''}","${item.distDate}",${item.distributedQty},${item.returnedDamagedQty},${item.returnedProductionGradeQty},${item.leftQty},"${item.returnDate}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `distribution_left_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!reportDate && filterBatchId === 'All') {
      alert(language === 'my' ? 'အစီရင်ခံစာ ကာလ ရွေးချယ်ပေးပါ' : 'Please select a report date/period first.');
      return;
    }

    let csvContent = '\uFEFF';
    const { label } = reportFilterRange;

    csvContent += `PipeFlow Centralized Inventory Report\n`;
    csvContent += `Period: ${label}\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;

    csvContent += `Summary Metrics\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `"${t.totalProducedUnits}",${reportData.totals.produced}\n`;
    csvContent += `"${t.totalDistributedUnits}",${reportData.totals.distributed}\n`;
    csvContent += `"${t.totalReturnedUnits}",${reportData.totals.returned}\n`;
    csvContent += `"${t.netInventoryChange}",${reportData.totals.balance}\n\n`;

    if (reportData.productions.length > 0) {
      csvContent += `Production Activity Summary\n`;
      csvContent += `Date,Batch ID,Pipe Model,Quantity (Units)\n`;
      reportData.productions.forEach((p: any) => {
        const pipeName = pipeTypes.find((pt) => pt.id === p.pipe_type_id)?.name || 'Unknown';
        csvContent += `"${p.date}","${p.batch_id || ''}","${pipeName}",${p.quantity}\n`;
      });
      csvContent += `\n`;
    }

    if (reportData.distributions.length > 0) {
      csvContent += `Distribution Outbound Summary\n`;
      csvContent += `Date,Outpost Node,Pipe Model,Batch ID,Quantity (Units),Unit Price (MMK),Total (MMK)\n`;
      reportData.distributions.forEach((d: any) => {
        const pipeName = pipeTypes.find((pt) => pt.id === d.pipe_type_id)?.name || 'Unknown';
        csvContent += `"${d.date}","${d.village}","${pipeName}","${d.batch_id || ''}",${d.quantity},${d.price},${d.quantity * d.price}\n`;
      });
      csvContent += `\n`;
    }

    if (reportData.returns.length > 0) {
      csvContent += `Outpost Returns Summary\n`;
      csvContent += `Date,Outpost Node,Pipe Model,Batch ID,Quantity (Units),Classification\n`;
      reportData.returns.forEach((r: any) => {
        const pipeName = pipeTypes.find((pt) => pt.id === r.pipe_type_id)?.name || 'Unknown';
        csvContent += `"${r.date}","${r.village}","${pipeName}","${r.batch_id || ''}",${r.quantity},"${r.status === 'damaged' ? 'DAMAGED' : 'PRODUCTION GRADE'}"\n`;
      });
      csvContent += `\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const downloadName = filterBatchId !== 'All' 
      ? `inventory_report_batch_${filterBatchId}.csv`
      : `inventory_report_${reportType}_${label.replace(/\s+/g, '_')}.csv`;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    if (reportType !== 'distribution_left' && !reportDate && filterBatchId === 'All') {
      alert(language === 'my' ? 'အစီရင်ခံစာ ကာလ ရွေးချယ်ပေးပါ' : 'Please select a report date/period first.');
      return;
    }
    window.print();
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
        date: new Date().toISOString().slice(0, 10),
        pipeTypeId: pipeTypes.length > 0 ? pipeTypes[0].id : 0,
        quantity: 0,
        batchId: '',
      });
      setActiveModal(null);
    });
  };

  const handleDistributionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitForm('/api/distribution', {
      date: distributionForm.date,
      village: distributionForm.village,
      batchId: distributionForm.batchId,
      quantity: distributionForm.quantity,
      price: distributionForm.price,
      fromLocation: distributionForm.fromLocation,
      toLocation: distributionForm.toLocation,
      remark: distributionForm.remark,
    }, () => {
      setDistributionForm({
        date: new Date().toISOString().slice(0, 10),
        village: villages.length > 0 ? villages[0].name : '',
        pipeTypeId: 0,
        quantity: 0,
        price: 0,
        fromLocation: 'Factory',
        toLocation: 'Village Store',
        remark: '',
        batchId: '',
      });
      setActiveModal(null);
    });
  };

  const handleReturnSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { date, village, batchId, qtyProductionGrade, qtyDamaged, price, remark } = returnForm;

    const totalQty = qtyProductionGrade + qtyDamaged;
    if (totalQty <= 0) {
      setMessage(language === 'my' ? 'ပြန်အပ်နှံမည့် အရေအတွက်သည် သုညထက် ကြီးရပါမည်။' : 'Quantity to return must be greater than zero.');
      return;
    }

    if (totalQty > selectedReturnBalance) {
      setMessage(
        language === 'my'
          ? 'အမှား - ပြန်အပ်နှံမည့် အရေအတွက်သည် ကျေးရွာရှိ လက်ကျန်ထက် မကျော်လွန်ရပါ။'
          : 'Error: Return quantity exceeds village outstanding balance.'
      );
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (qtyProductionGrade > 0) {
        const res = await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            village,
            batchId,
            quantity: qtyProductionGrade,
            status: 'production_grade',
            price,
            remark: qtyDamaged > 0 ? `${remark} (Production Grade part)` : remark,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || 'Failed to save Production Grade return.');
          setIsSubmitting(false);
          return;
        }
      }

      if (qtyDamaged > 0) {
        const res = await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            village,
            batchId,
            quantity: qtyDamaged,
            status: 'damaged',
            price: 0,
            remark: qtyProductionGrade > 0 ? `${remark} (Damaged part)` : remark,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || 'Failed to save Damaged return.');
          setIsSubmitting(false);
          await loadData();
          await loadVillages();
          await loadAuditLogs();
          return;
        }
      }

      setMessage(language === 'my' ? 'ပြန်အပ်နှံမှု မှတ်တမ်း သိမ်းဆည်းပြီးပါပြီ။' : 'Returns saved successfully.');
      setReturnForm({
        date: new Date().toISOString().slice(0, 10),
        village: villages.length > 0 ? villages[0].name : '',
        pipeTypeId: 0,
        qtyProductionGrade: 0,
        qtyDamaged: 0,
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
      
      const itemDate = new Date(item.date);
      const matchStart = !filterStartDate || itemDate >= new Date(filterStartDate);
      const matchEnd = !filterEndDate || itemDate <= new Date(filterEndDate);

      return matchVillage && matchPipeType && matchBatchId && matchStart && matchEnd;
    });
  }, [distributions, filterVillage, filterPipeType, filterBatchId, filterStartDate, filterEndDate]);

  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      const matchVillage = filterVillage === 'All' || item.village === filterVillage;
      const matchPipeType = filterPipeType === 'All' || item.pipe_type_id === Number(filterPipeType);
      const matchStatus = filterStatus === 'All' || item.status === filterStatus;
      const matchBatchId = filterBatchId === 'All' || item.batch_id === filterBatchId;

      const itemDate = new Date(item.date);
      const matchStart = !filterStartDate || itemDate >= new Date(filterStartDate);
      const matchEnd = !filterEndDate || itemDate <= new Date(filterEndDate);

      return matchVillage && matchPipeType && matchStatus && matchBatchId && matchStart && matchEnd;
    });
  }, [returnsList, filterVillage, filterPipeType, filterStatus, filterBatchId, filterStartDate, filterEndDate]);

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
      dists: distributions.filter((d) => isWithinPeriod(d.date)),
      rets: returnsList.filter((r) => isWithinPeriod(r.date)),
    };
  }, [distributions, returnsList, financePeriod]);

  const financeKPIs = useMemo(() => {
    const { dists, rets } = filteredFinanceData;

    const totalRevenue = dists.reduce((sum, d) => sum + (Number(d.quantity || 0) * Number(d.price || 0)), 0);
    const totalRefunds = rets.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.price || 0)), 0);
    const netProfit = (totalRevenue - totalRefunds) * (-1);
    const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 - 100 : 0;

    return {
      totalRevenue,
      totalRefunds,
      netProfit,
      refundRate,
    };
  }, [filteredFinanceData]);

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
          <div className="loader-logo-pulse">PI</div>
          <div className="loader-bar-track">
            <div className="loader-bar-fill" />
          </div>
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
          <div className="logo-mark">Inve</div>
          <h2>{isRegistering ? (language === 'my' ? 'အက်ဒမင် အကောင့်ပြုလုပ်ရန်' : 'Create Admin Account') : (language === 'my' ? 'စနစ်ထဲသို့ ဝင်ရန်' : 'Sign in to Pipe Flow')}</h2>
          <p className="login-subtitle">
            {isRegistering 
              ? (language === 'my' ? 'စနစ်ထိန်းချုပ်ရန် အက်ဒမင်အကောင့်အသစ်တစ်ခု ဖန်တီးပါ။' : 'Provision a new administrator account for system control.')
              : (language === 'my' ? 'ပိုက်ကုန်ပစ္စည်းများနှင့် အရည်အသွေးထိန်းချုပ်မှုကို စီမံခန့်ခွဲရန် ဝင်ရောက်ပါ။' : 'Access central pipe inventory management and quality tracking.')}
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
        <div className="logo-block">
          <div className="logo-mark">PI</div>
          <div>
            <div className="sidebar-title">PipeFlow</div>
            <div className="sidebar-subtitle">Inventory App</div>
          </div>
          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
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
        </nav>

        <div className="sidebar-footer">
          {/* Sleek Language Switcher Pill */}
          <div className="lang-switcher-block">
            <button 
              type="button" 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button 
              type="button" 
              className={`lang-btn ${language === 'my' ? 'active' : ''}`}
              onClick={() => setLanguage('my')}
            >
              မြန်မာ
            </button>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <span className="link-text">{t.signOut} ({user.email.split('@')[0]})</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-content">
        <div className="dashboard-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button" 
                className="mobile-menu-btn" 
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                ☰
              </button>
              <h1>{PAGE_TITLES[activeTab]?.[language] || activeTab}</h1>
            </div>
            {PAGE_SUBHEADINGS[activeTab]?.[language] && (
              <p className="subheading" style={{ margin: '4px 0 0 0' }}>
                {PAGE_SUBHEADINGS[activeTab]?.[language]}
              </p>
            )}
          </div>
          {user.role === 'admin' && (
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {activeTab === 'Overview' && (
                <button 
                  className="primary" 
                  onClick={() => setActiveModal('distribution')}
                >
                  {t.addDistribution}
                </button>
              )}
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
                <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
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
                  <h3>{totalProduction}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.totalDistributedUnits}</p>
                  <h3>{totalDistributed}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.totalReturnedUnits}</p>
                  <h3>{totalReturned}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.leftToReturn}</p>
                  <h3>{totalDistributed - totalReturned}</h3>
                </div>
                <div className="summary-card">
                  <p>{t.currentBalance}</p>
                  <h3>{currentBalance}</h3>
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
                      {weeklyVelocity.map((item, index) => {
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
                      })}
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
                    {systemAlerts.length === 0 ? (
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
            <div className="table-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{language === 'my' ? 'ကုန်ထုတ်လုပ်မှု မှတ်တမ်းများ' : 'Production Log Registry'}</h2>
                <input
                  type="text"
                  placeholder={t.searchBatchId}
                  style={{ width: '180px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={searchBatchId}
                  onChange={(e) => setSearchBatchId(e.target.value)}
                />
              </div>
              <div className="table-wrapper">
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
                    {productions.length === 0 ? (
                      <tr>
                        <td colSpan={user.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          {t.noBatchesRegistered}
                        </td>
                      </tr>
                    ) : (
                      productions
                        .filter(p => (p.batch_id || '').toLowerCase().includes(searchBatchId.toLowerCase()))
                        .map((prod) => {
                          const pipeName = pipeTypes.find((p) => p.id === prod.pipe_type_id)?.name || 'Unknown Pipe';
                          const hasDamaged = returnsList.some((r) => r.pipe_type_id === prod.pipe_type_id && r.status === 'damaged');
                          return (
                            <tr key={prod.id}>
                              <td>{prod.date}</td>
                              <td>
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
                              <td>{pipeName}</td>
                              <td>{prod.quantity} {language === 'my' ? 'ယူနစ်' : 'units'}</td>
                              <td>
                                {hasDamaged ? (
                                  <span className="badge badge-warning">{t.defectReturns}</span>
                                ) : (
                                  <span className="badge badge-success">{t.passedQcInspection}</span>
                                )}
                              </td>
                              {user.role === 'admin' && (
                                <td>
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
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                    onChange={(e) => setFilterVillage(e.target.value)}
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
                    onChange={(e) => setFilterPipeType(e.target.value)}
                  >
                    <option value="All">{t.allPipeModels}</option>
                    {pipeTypes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-batch-id-select">{t.batchIdLabel}</label>
                  <select
                    id="filter-batch-id-select"
                    value={filterBatchId}
                    onChange={(e) => setFilterBatchId(e.target.value)}
                  >
                    <option value="All">{t.allBatches}</option>
                    {registeredBatchesList.map((b) => (
                      <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-start-date">{t.startDate}:</label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="filter-end-date">{t.endDate}:</label>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* DISTRIBUTION HISTORY TABLE */}
              <div className="table-panel">
                <h2>{t.filteredDistributionLogs}</h2>
                <p style={{ marginBottom: '16px' }}>{t.listOfAllOutgoingOutpostDeliveries}</p>
                <div className="table-wrapper">
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
                      {filteredDistributions.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noDistributionRecords}
                          </td>
                        </tr>
                      ) : (
                        filteredDistributions.map((item) => (
                          <tr key={item.id}>
                            <td>{item.date}</td>
                            <td>{item.village}</td>
                            <td>{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown model'}</td>
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
                            {user.role === 'admin' && (
                              <td>
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
                    onChange={(e) => setFilterVillage(e.target.value)}
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
                    onChange={(e) => setFilterPipeType(e.target.value)}
                  >
                    <option value="All">{t.allPipeModels}</option>
                    {pipeTypes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-batch-id-filter">{t.batchIdLabel}</label>
                  <select
                    id="return-batch-id-filter"
                    value={filterBatchId}
                    onChange={(e) => setFilterBatchId(e.target.value)}
                  >
                    <option value="All">{t.allBatches}</option>
                    {registeredBatchesList.map((b) => (
                      <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-status-filter">{t.classification}:</label>
                  <select
                    id="return-status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">{t.allStatuses}</option>
                    <option value="production_grade">{language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'Production Grade'}</option>
                    <option value="damaged">{language === 'my' ? 'ပျက်စီး' : 'Damaged'}</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="return-start-date">{t.startDate}:</label>
                  <input
                    id="return-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="return-end-date">{t.endDate}:</label>
                  <input
                    id="return-end-date"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* RETURNS HISTORY TABLE */}
              <div className="table-panel">
                <h2>{t.filteredReturnsLogs}</h2>
                <p style={{ marginBottom: '16px' }}>{t.listOfIncomingReturns}</p>
                <div className="table-wrapper">
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
                      {filteredReturns.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'admin' ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noReturnLogsMatch}
                          </td>
                        </tr>
                      ) : (
                        filteredReturns.map((item) => (
                          <tr key={item.id}>
                            <td>{item.date}</td>
                            <td>{item.village}</td>
                            <td>{pipeTypes.find((p) => p.id === item.pipe_type_id)?.name || 'Unknown model'}</td>
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
                                  ? (language === 'my' ? 'ပျက်စီး' : 'DAMAGED') 
                                  : (language === 'my' ? 'ထုတ်လုပ်မှု အဆင့်မီ' : 'PRODUCTION GRADE')}
                              </span>
                            </td>
                            <td>{formatCurrency(item.price || 0)}</td>
                            <td>{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                            {user.role === 'admin' && (
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
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
                    onChange={(e) => setFilterVillage(e.target.value)}
                  >
                    <option value="All">{t.allVillages}</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="recon-batch-id-select">{t.batchIdLabel}</label>
                  <select
                    id="recon-batch-id-select"
                    value={filterBatchId}
                    onChange={(e) => setFilterBatchId(e.target.value)}
                  >
                    <option value="All">{t.allBatches}</option>
                    {registeredBatchesList.map((b) => (
                      <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RECONCILIATION SUMMARY TABLE */}
              <div className="table-panel">
                <h2>{t.overallDistributeSummary}</h2>
                <p style={{ marginBottom: '16px' }}>{t.whenAndWhenReturn}</p>
                <div className="table-wrapper">
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
                      {filteredReconciliation.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noClaims}
                          </td>
                        </tr>
                      ) : (
                        filteredReconciliation.map((item) => (
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
                            <td>
                              {item.distributedQty === 0 || item.distributedQty === 'N/A'
                                ? `0 ${language === 'my' ? 'ယူနစ်' : 'units'}`
                                : `${item.distributedQty} ${language === 'my' ? 'ယူနစ်' : 'units'}`}
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {item.distDate}
                            </td>
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
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {item.returnDate}
                            </td>
                            <td>
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
              </div>
            </>
          )}

          {/* FINANCE TAB RENDER */}
          {activeTab === 'Finance' && (
            <>
              {/* Financial Period Filter Control */}
              <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="filter-group">
                  <label>{t.timePeriod}:</label>
                  <div className="button-group-toggle" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`tab-btn-mini ${financePeriod === 'day' ? 'active' : ''}`}
                      onClick={() => setFinancePeriod('day')}
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
                      onClick={() => setFinancePeriod('week')}
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
                      onClick={() => setFinancePeriod('month')}
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
                      onClick={() => setFinancePeriod('all')}
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
                  </div>
                </div>
              </div>

              {/* Finance KPIs stats grid */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <p>{t.totalRevenue}</p>
                  <h3 style={{ color: 'var(--primary)', marginTop: '8px' }}>
                    {formatCurrency(financeKPIs.totalRevenue)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--accent-red, #ef4444)' }}>
                  <p>{t.totalRefunds}</p>
                  <h3 style={{ color: 'var(--accent-red, #ef4444)', marginTop: '8px' }}>
                    {formatCurrency(financeKPIs.totalRefunds)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: `4px solid ${financeKPIs.netProfit >= 0 ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)'}` }}>
                  <p>{t.netProfit}</p>
                  <h3 style={{ color: financeKPIs.netProfit >= 0 ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)', marginTop: '8px' }}>
                    {formatCurrency(financeKPIs.netProfit)}
                  </h3>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid var(--warning, #f59e0b)' }}>
                  <p>{t.refundRate}</p>
                  <h3 style={{ color: 'var(--warning, #f59e0b)', marginTop: '8px' }}>
                    +{financeKPIs.refundRate.toFixed(1)}%
                  </h3>
                </div>
              </div>

              <div className="charts-flex-row" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                {/* RE-BUY VS PRODUCTION TABLE */}
                <div className="table-panel" style={{ width: '100%' }}>
                  <h2>{t.rebuyVsProduction}</h2>
                  <p></p>
                  <div className="table-wrapper">
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
                        {modelFinanceData.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {t.noClaims}
                            </td>
                          </tr>
                        ) : (
                          modelFinanceData.map((item) => {
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
                </div>

                {/* BATCH-SPECIFIC RE-BUY & PRODUCTION RATIO TABLE */}
                <div className="table-panel" style={{ width: '100%' }}>
                  <h2>{t.batchFinanceRatio}</h2>
                  <p></p>
                  <div className="table-wrapper">
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
                        {batchFinanceData.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              {t.noClaims}
                            </td>
                          </tr>
                        ) : (
                          batchFinanceData.map((item) => {
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
                </div>
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
                    onChange={(e) => setReportType(e.target.value as any)}
                  >
                    <option value="daily">{t.daily}</option>
                    <option value="weekly">{t.weekly}</option>
                    <option value="monthly">{t.monthly}</option>
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
                        onChange={(e) => setReportVillage(e.target.value)}
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
                        onChange={(e) => setReportPipeTypeId(e.target.value)}
                      >
                        <option value="All">{t.allPipeModels}</option>
                        {pipeTypes.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-batch-select">{t.batchIdLabel}</label>
                      <select
                        id="report-batch-select"
                        value={reportBatchId}
                        onChange={(e) => setReportBatchId(e.target.value)}
                      >
                        <option value="All">{t.allBatches}</option>
                        {registeredBatchesList.map((b) => (
                          <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-date-select">{language === 'my' ? 'ရက်စွဲ:' : 'Date:'}</label>
                      <input
                        id="report-date-select"
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label htmlFor="report-batch-id-select">{t.batchIdLabel}</label>
                      <select
                        id="report-batch-id-select"
                        value={filterBatchId}
                        onChange={(e) => setFilterBatchId(e.target.value)}
                      >
                        <option value="All">{t.allBatches}</option>
                        {registeredBatchesList.map((b) => (
                          <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginLeft: 'auto' }}>
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
                      <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>PIPEFLOW SYSTEMS</h1>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Centralized Pipe Inventory Network</p>
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
                      {reportFilterRange.label || (language === 'my' ? 'ရွေးချယ်မထားပါ' : 'Not Selected')}
                    </strong>
                  </p>
                </div>

                {/* Period Summary Cards */}
                {reportType === 'distribution_left' ? (
                  <div className="stats-grid report-summary-grid" style={{ marginBottom: '32px', border: '1px solid var(--border-color)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'စုစုပေါင်း ဖြန့်ဖြူးပြီး အရေအတွက်' : 'Total Distributed Units'}</p>
                      <h3>{reportData.totals.distributed}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'စုစုပေါင်း ပြန်အပ်နှံပြီး အရေအတွက်' : 'Total Returned Units'}</p>
                      <h3>{reportData.totals.returned}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{language === 'my' ? 'ပြန်အပ်ရန် ကျန်ရှိသော အရေအတွက်' : 'Left to Return to Company'}</p>
                      <h3 style={{ color: reportData.totals.balance > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {reportData.totals.balance}
                      </h3>
                    </div>
                  </div>
                ) : (
                  <div className="stats-grid report-summary-grid" style={{ marginBottom: '32px', border: '1px solid var(--border-color)' }}>
                    <div className="summary-card">
                      <p>{t.totalProducedUnits}</p>
                      <h3>{reportData.totals.produced}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.totalDistributedUnits}</p>
                      <h3>{reportData.totals.distributed}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.totalReturnedUnits}</p>
                      <h3>{reportData.totals.returned}</h3>
                    </div>
                    <div className="summary-card">
                      <p>{t.netInventoryChange}</p>
                      <h3 style={{ color: reportData.totals.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {reportData.totals.balance >= 0 ? '+' : ''}
                        {reportData.totals.balance}
                      </h3>
                    </div>
                  </div>
                )}

                {reportType === 'distribution_left' ? (
                  reportFilteredRecon.length === 0 ? (
                    <div className="no-activity-placeholder" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📋</span>
                      <p>{language === 'my' ? 'မှတ်တမ်း မရှိပါ။' : 'No records found.'}</p>
                    </div>
                  ) : (
                    <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚚 {language === 'my' ? 'ဖြန့်ဖြူးမှုနှင့် ကျန်ရှိသောပြန်အပ်ရန် စာရင်း' : 'Distribution & Left to Return Summary'}
                      </h3>
                      <div className="table-wrapper">
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
                            {reportFilteredRecon.map((item: any) => (
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ) : (
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
                      {reportData.productions.length > 0 && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🏭 {t.productionSummaryHeader}</h3>
                          <div className="table-wrapper">
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
                                {reportData.productions.map((item: any) => (
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
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Distribution Summary Table */}
                      {reportData.distributions.length > 0 && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🚚 {t.distributionSummaryHeader}</h3>
                          <div className="table-wrapper">
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
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.distributions.map((item: any) => (
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
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Returns Summary Table */}
                      {reportData.returns.length > 0 && (
                        <div className="table-panel report-table-panel" style={{ padding: 0 }}>
                          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🔄 {t.returnsSummaryHeader}</h3>
                          <div className="table-wrapper">
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
                                {reportData.returns.map((item: any) => (
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
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* DYNAMIC CATALOG Settings TAB RENDER */}
          {activeTab === 'Catalog Settings' && (
            <div className="split-pane-wrapper">
              
              {/* Left Column: Pipe Models CRUD */}
              <div className="table-panel" style={{ padding: '40px', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
                <h2>{t.centralPipesCatalog}</h2>
                <p style={{ marginBottom: '24px' }}>{t.configureStandardRates}</p>
                
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.modelName}</th>
                        <th>{t.currentPrice}</th>
                        <th>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipeTypes.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No pipe models registered in the catalog.
                          </td>
                        </tr>
                      ) : (
                        pipeTypes.map((pipe) => (
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
              </div>

              {/* Right Column: Outpost Registry CRUD */}
              <div className="table-panel" style={{ padding: '40px', overflowY: 'auto' }}>
                <h2>{t.villageOutpostRegistry}</h2>
                <p style={{ marginBottom: '24px' }}>{t.manageActiveNodes}</p>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.outpostNode}</th>
                        <th>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villages.length === 0 ? (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {t.noVillageNodesRegistered}
                          </td>
                        </tr>
                      ) : (
                        villages.map((v) => (
                          <tr key={v.id}>
                            <td>{v.name}</td>
                            <td>
                              {user.role === 'admin' ? (
                                <button
                                  type="button"
                                  className="action-btn delete"
                                  disabled={isSubmitting}
                                  onClick={() => handleDeleteVillage(v.id)}
                                >
                                  {t.delete}
                                </button>
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
              </div>

            </div>
          )}

          {/* AUDIT LOGS TAB RENDER */}
          {activeTab === 'Audit Logs' && user.role === 'admin' && (
            <div className="table-panel">
              <h2>{t.operationalSystemAuditTrail}</h2>
              <p>{t.chronologicalSecurityLogs}</p>
              <div className="table-wrapper">
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
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          {t.noAuditEntriesLogged}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td>{log.user_email}</td>
                          <td>
                            <span className="badge badge-success" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                              {log.action}
                            </span>
                          </td>
                          <td className="details-col" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {log.details || 'None'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL OVERLAYS */}
        {activeModal && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                        <select
                          id="production-pipe-type"
                          disabled={user.role !== 'admin'}
                          value={productionForm.pipeTypeId}
                          onChange={(event) => setProductionForm({ ...productionForm, pipeTypeId: Number(event.target.value) })}
                        >
                          {pipeTypes.map((pipe) => (
                            <option key={pipe.id} value={pipe.id}>
                              {pipe.name} ({formatCurrency(pipe.unit_price)} / unit)
                            </option>
                          ))}
                        </select>
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
                        <label htmlFor="production-batch">{t.productionBatchId}</label>
                        <input
                          id="production-batch"
                          type="text"
                          placeholder="e.g. BATCH-2026-X"
                          disabled={user.role !== 'admin'}
                          value={productionForm.batchId}
                          onChange={(event) => setProductionForm({ ...productionForm, batchId: event.target.value })}
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
                          disabled={user.role !== 'admin'}
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
                        <select
                          id="distribution-batch-id"
                          required
                          disabled={user.role !== 'admin'}
                          value={distributionForm.batchId}
                          onChange={(event) => {
                            const selectedBatchId = event.target.value;
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
                        >
                          <option value="">{language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}</option>
                          {registeredBatchesList
                            .filter((batch) => !batchStatusMap[batch.batchId]?.isFullyReturned)
                            .map((batch) => (
                              <option key={batch.batchId} value={batch.batchId}>
                                {batch.batchId} ({batch.pipeName})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="distribution-quantity">{t.quantityToDeliver}</label>
                        <input
                          id="distribution-quantity"
                          type="number"
                          placeholder="0"
                          min="1"
                          required
                          disabled={user.role !== 'admin'}
                          value={distributionForm.quantity === 0 ? '' : (distributionForm.quantity || '')}
                          onChange={(event) => setDistributionForm({ ...distributionForm, quantity: Number(event.target.value) })}
                        />
                        <small>{t.maximumFactoryAvailable}: {batchStockMap[distributionForm.batchId] ?? 0} {language === 'my' ? 'ယူနစ်' : 'units'}</small>
                      </div>                      <div className="form-group">
                        <label htmlFor="distribution-price">{t.autoCalculatedUnitPrice}</label>
                        <input
                          id="distribution-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin'}
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
                            qtyProductionGrade: 0,
                            qtyDamaged: 0,
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
                        <select
                          id="return-batch-id"
                          required
                          disabled={user.role !== 'admin'}
                          value={returnForm.batchId}
                          onChange={(event) => {
                            const selectedBatchId = event.target.value;
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
                        >
                          <option value="">{language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}</option>
                          {deployedBatchesForSelectedVillage.map((batch) => (
                            <option key={batch.batchId} value={batch.batchId}>
                              {batch.batchId} ({batch.pipeName}) - {batch.balance} {language === 'my' ? 'လုံး ဖြန့်ထားသည်' : 'deployed'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-qty-production-grade">
                          {language === 'my' 
                            ? 'ထုတ်လုပ်မှု အဆင့်မီ အရေအတွက် (ကုမ္ပဏီမှ ပြန်လည်ဝယ်ယူသည်)' 
                            : 'Quantity - Production Grade (Re-bought)'}
                        </label>
                        <input
                          id="return-qty-production-grade"
                          type="number"
                          placeholder="0"
                          min="0"
                          disabled={user.role !== 'admin'}
                          value={returnForm.qtyProductionGrade === 0 ? '' : returnForm.qtyProductionGrade}
                          onChange={(event) => setReturnForm({ ...returnForm, qtyProductionGrade: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-qty-damaged">
                          {language === 'my' 
                            ? 'ပျက်စီး အရေအတွက် (ကျေးရွာသို့ ပြန်လည်ပေးပို့ - ဝယ်ယူမှုမရှိ)' 
                            : 'Quantity - Damaged (No Re-buy)'}
                        </label>
                        <input
                          id="return-qty-damaged"
                          type="number"
                          placeholder="0"
                          min="0"
                          disabled={user.role !== 'admin'}
                          value={returnForm.qtyDamaged === 0 ? '' : returnForm.qtyDamaged}
                          onChange={(event) => setReturnForm({ ...returnForm, qtyDamaged: Number(event.target.value) })}
                        />
                      </div>

                      <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <small style={{ fontWeight: '500' }}>
                          {t.villageBalanceCurrentlyDeployed}: {Math.max(0, selectedReturnBalance - (returnForm.qtyProductionGrade + returnForm.qtyDamaged))} {language === 'my' ? 'ယူနစ်' : 'units'}
                        </small>
                        <small style={{ color: (returnForm.qtyProductionGrade + returnForm.qtyDamaged) > selectedReturnBalance ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {language === 'my' 
                            ? `စုစုပေါင်း ပြန်အပ်နှံမည့် အရေအတွက်: ${returnForm.qtyProductionGrade + returnForm.qtyDamaged} ယူနစ်`
                            : `Total return quantity: ${returnForm.qtyProductionGrade + returnForm.qtyDamaged} units`}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="return-price">{t.returnUnitPrice}</label>
                        <input
                          id="return-price"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          disabled={user.role !== 'admin' || returnForm.qtyProductionGrade <= 0}
                          value={returnForm.qtyProductionGrade <= 0 ? 0 : (returnForm.price || '')}
                          onChange={(event) => setReturnForm({ ...returnForm, price: Number(event.target.value) })}
                        />
                        {returnForm.qtyProductionGrade <= 0 && (
                          <small style={{ color: 'var(--text-secondary)' }}>
                            {language === 'my' 
                              ? 'ထုတ်လုပ်မှု အဆင့်မီ ပစ္စည်း အရေအတွက် ၀ ထက်ကြီးမှသာ ပြန်လည်ဝယ်ယူသည့် ဈေးနှုန်းထည့်သွင်းနိုင်ပါမည်။' 
                              : 'Re-buy price is only applicable when Production Grade quantity is greater than 0.'}
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
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting}>
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
                    </div>
                    <button className="primary" type="submit" style={{ marginTop: '16px' }} disabled={isSubmitting}>
                      {t.addOutpostNode}
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
                        <select
                          id="edit-production-pipe-type"
                          disabled={user.role !== 'admin'}
                          value={editProductionForm.pipeTypeId}
                          onChange={(event) => setEditProductionForm({ ...editProductionForm, pipeTypeId: Number(event.target.value) })}
                        >
                          {pipeTypes.map((pipe) => (
                            <option key={pipe.id} value={pipe.id}>
                              {pipe.name} ({formatCurrency(pipe.unit_price)} / unit)
                            </option>
                          ))}
                        </select>
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
                        <select
                          id="edit-distribution-batch-id"
                          disabled={user.role !== 'admin'}
                          value={editDistributionForm.batchId}
                          onChange={(event) => {
                            const selectedBatchId = event.target.value;
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
                        >
                          <option value="">{language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}</option>
                          {registeredBatchesList
                            .filter((batch) => !batchStatusMap[batch.batchId]?.isFullyReturned || batch.batchId === editDistributionForm.batchId)
                            .map((batch) => (
                              <option key={batch.batchId} value={batch.batchId}>
                                {batch.batchId} ({batch.pipeName}) - {batch.availableStock} {language === 'my' ? 'လက်ကျန်' : 'available'}
                              </option>
                            ))}
                        </select>
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
                        <select
                          id="edit-return-batch-id"
                          disabled={user.role !== 'admin'}
                          value={editReturnForm.batchId}
                          onChange={(event) => {
                            const selectedBatchId = event.target.value;
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
                        >
                          <option value="">{language === 'my' ? '-- အသုတ်ရွေးချယ်ပါ --' : '-- Select Batch --'}</option>
                          {deployedBatchesForEditVillage.map((batch) => (
                            <option key={batch.batchId} value={batch.batchId}>
                              {batch.batchId} ({batch.pipeName}) - {batch.balance} {language === 'my' ? 'လုံး ဖြန့်ထားသည်' : 'deployed'}
                            </option>
                          ))}
                        </select>
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
                          disabled={user.role !== 'admin'}
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
              </div>
            </div>
          </div>
        )}

        {viewingBatchId && viewingBatchDetails && (
          <div className="modal-overlay" onClick={() => setViewingBatchId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
              <div className="modal-header">
                <h2>
                  {language === 'my' 
                    ? `အသုတ် အချက်အလက် - ${viewingBatchId}` 
                    : `Batch Details - ${viewingBatchId}`}
                </h2>
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
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>{language === 'my' ? 'ထုတ်လုပ်သည့် ရက်စွဲ' : 'Production Date'}</th>
                            <th>{language === 'my' ? 'အရေအတွက်' : 'Quantity'}</th>
                            <th>{language === 'my' ? 'အခြေခံဈေးနှုန်း' : 'Base Price'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingBatchDetails.productions.map((p) => (
                            <tr key={p.id}>
                              <td>{p.date}</td>
                              <td>{p.quantity} {language === 'my' ? 'လုံး' : 'units'}</td>
                              <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {language === 'my' ? '၂။ ဖြန့်ဖြူးမှု သမိုင်းကြောင်း (ဘယ်သူ့ဆီ / ဘယ်နေရာ)' : '2. Distribution History (When & Where)'}
                  </h3>
                  {viewingBatchDetails.distributions.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ဖြန့်ဖြူးမှု မှတ်တမ်း မရှိပါ။' : 'No distribution records found.'}</p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>{language === 'my' ? 'ရက်စွဲ' : 'Date'}</th>
                            <th>{language === 'my' ? 'ကျေးရွာ' : 'Outpost / Destination'}</th>
                            <th>{language === 'my' ? 'မှ - သို့ (တည်နေရာ)' : 'From - To (Location)'}</th>
                            <th>{language === 'my' ? 'အရေအတွက်' : 'Quantity'}</th>
                            <th>{language === 'my' ? 'ဖြန့်ဖြူးဈေးနှုန်း' : 'Price'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingBatchDetails.distributions.map((d) => (
                            <tr key={d.id}>
                              <td>{d.date}</td>
                              <td>{d.village}</td>
                              <td>{d.from_location || 'Factory'} &rarr; {d.to_location || 'Village Store'}</td>
                              <td>{d.quantity} {language === 'my' ? 'လုံး' : 'units'}</td>
                              <td>{formatCurrency(d.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {language === 'my' ? '၃။ ပြန်လည်အပ်နှံမှု အသေးစိတ်' : '3. Returns Breakdown'}
                  </h3>
                  {viewingBatchDetails.returns.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ပြန်လည်အပ်နှံမှု မှတ်တမ်း မရှိပါ။' : 'No return records found.'}</p>
                  ) : (
                    <div className="table-wrapper">
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
                          {viewingBatchDetails.returns.map((r) => (
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
    </div>
  );
}
