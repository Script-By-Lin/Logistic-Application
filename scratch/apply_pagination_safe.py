import os

def apply_replacements():
    filepath = r'c:\Users\Script-Kid\Desktop\Client_Inventory_Management\app\components\InventoryApp.tsx'
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist.")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define all replacements (Target -> Replacement)
    replacements = []

    # 0) Insert Pagination state, print hooks, reset effects, and the PaginationControls component
    # We will do this by replacing line 722 section
    replacements.append((
        '  const [isBackupRestoring, setIsBackupRestoring] = useState(false);\n  const [backupMessage, setBackupMessage] = useState<string | null>(null);',
        '''  const [isBackupRestoring, setIsBackupRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // --- Pagination State & Helpers ---
  const [pages, setPages] = useState<Record<string, number>>({});
  const [isPrinting, setIsPrinting] = useState(false);

  const getPage = (key: string) => pages[key] || 1;
  const setPage = (key: string, pageNum: number) => {
    setPages((prev) => ({ ...prev, [key]: pageNum }));
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

  const PaginationControls = ({ tableKey, totalItems, pageSize = 10 }: { tableKey: string; totalItems: number; pageSize?: number }) => {
    const currentPage = getPage(tableKey);
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    if (totalPages <= 1) return null;

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
      <div className="pagination-controls no-print">
        <span className="pagination-info">
          {language === 'my' 
            ? `စုစုပေါင်းမှတ်တမ်း ${totalItems} ခုအနက် စာမျက်နှာ ${currentPage} / ${totalPages}`
            : `Showing page ${currentPage} of ${totalPages} (${totalItems} items)`}
        </span>
        <div className="pagination-buttons">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(tableKey, currentPage - 1)}
          >
            {language === 'my' ? 'ယခင်' : 'Prev'}
          </button>
          {pagesToShow.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
              disabled={p === '...'}
              onClick={() => typeof p === 'number' && setPage(tableKey, p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setPage(tableKey, currentPage + 1)}
          >
            {language === 'my' ? 'နောက်သို့' : 'Next'}
          </button>
        </div>
      </div>
    );
  };'''
    ))

    # 1) Production table onChange
    replacements.append((
        '                  value={searchBatchId}\n                  onChange={(e) => setSearchBatchId(e.target.value)}',
        '                  value={searchBatchId}\n                  onChange={(e) => {\n                    setSearchBatchId(e.target.value);\n                    setPage(\'production\', 1);\n                  }}'
    ))

    # 2) Production table map and pagination controls
    # We now map over filteredProductions!
    replacements.append((
        '                      productions\n                        .filter(p => (p.batch_id || \'\').toLowerCase().includes(searchBatchId.toLowerCase()))\n                        .map((prod) => {',
        '                      (isPrinting ? filteredProductions : filteredProductions.slice((getPage(\'production\') - 1) * 10, getPage(\'production\') * 10)).map((prod) => {'
    ))

    # Let's insert PaginationControls for production table
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {/* DISTRIBUTION TAB RENDER */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="production"\n                  totalItems={filteredProductions.length}\n                />\n              </div>\n            </div>\n          )}\n\n          {/* DISTRIBUTION TAB RENDER */}'
    ))

    # 3) Distribution filters onChange
    replacements.append((
        '                    value={filterVillage}\n                    onChange={(e) => setFilterVillage(e.target.value)}',
        '                    value={filterVillage}\n                    onChange={(e) => {\n                      setFilterVillage(e.target.value);\n                      setPage(\'distribution\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterPipeType}\n                    onChange={(e) => setFilterPipeType(e.target.value)}',
        '                    value={filterPipeType}\n                    onChange={(e) => {\n                      setFilterPipeType(e.target.value);\n                      setPage(\'distribution\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterBatchId}\n                    onChange={(e) => setFilterBatchId(e.target.value)}',
        '                    value={filterBatchId}\n                    onChange={(e) => {\n                      setFilterBatchId(e.target.value);\n                      setPage(\'distribution\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterStartDate}\n                    onChange={(e) => setFilterStartDate(e.target.value)}',
        '                    value={filterStartDate}\n                    onChange={(e) => {\n                      setFilterStartDate(e.target.value);\n                      setPage(\'distribution\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterEndDate}\n                    onChange={(e) => setFilterEndDate(e.target.value)}',
        '                    value={filterEndDate}\n                    onChange={(e) => {\n                      setFilterEndDate(e.target.value);\n                      setPage(\'distribution\', 1);\n                    }}'
    ))

    # 4) Distribution table mapping & pagination controls
    replacements.append((
        '                      filteredDistributions.map((item) => (',
        '                      (isPrinting ? filteredDistributions : filteredDistributions.slice((getPage(\'distribution\') - 1) * 10, getPage(\'distribution\') * 10)).map((item) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            </>\n          )}\n\n          {/* RETURNS TAB RENDER */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="distribution"\n                  totalItems={filteredDistributions.length}\n                />\n              </div>\n            </>\n          )}\n\n          {/* RETURNS TAB RENDER */}'
    ))

    # 5) Returns filters onChange
    # (Note: target is unique because of status/returns context)
    replacements.append((
        '                    id="return-village-filter"\n                    value={filterVillage}\n                    onChange={(e) => setFilterVillage(e.target.value)}',
        '                    id="return-village-filter"\n                    value={filterVillage}\n                    onChange={(e) => {\n                      setFilterVillage(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="return-pipe-filter"\n                    value={filterPipeType}\n                    onChange={(e) => setFilterPipeType(e.target.value)}',
        '                    id="return-pipe-filter"\n                    value={filterPipeType}\n                    onChange={(e) => {\n                      setFilterPipeType(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="return-batch-id-filter"\n                    value={filterBatchId}\n                    onChange={(e) => setFilterBatchId(e.target.value)}',
        '                    id="return-batch-id-filter"\n                    value={filterBatchId}\n                    onChange={(e) => {\n                      setFilterBatchId(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="return-status-filter"\n                    value={filterStatus}\n                    onChange={(e) => setFilterStatus(e.target.value)}',
        '                    id="return-status-filter"\n                    value={filterStatus}\n                    onChange={(e) => {\n                      setFilterStatus(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="return-start-date"\n                    type="date"\n                    value={filterStartDate}\n                    onChange={(e) => setFilterStartDate(e.target.value)}',
        '                    id="return-start-date"\n                    type="date"\n                    value={filterStartDate}\n                    onChange={(e) => {\n                      setFilterStartDate(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="return-end-date"\n                    type="date"\n                    value={filterEndDate}\n                    onChange={(e) => setFilterEndDate(e.target.value)}',
        '                    id="return-end-date"\n                    type="date"\n                    value={filterEndDate}\n                    onChange={(e) => {\n                      setFilterEndDate(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))

    # 6) Returns table mapping & pagination controls
    replacements.append((
        '                      filteredReturns.map((item) => (',
        '                      (isPrinting ? filteredReturns : filteredReturns.slice((getPage(\'returns\') - 1) * 10, getPage(\'returns\') * 10)).map((item) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            </>\n          )}\n\n          {/* RECONCILIATION SUMMARY TAB */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="returns"\n                  totalItems={filteredReturns.length}\n                />\n              </div>\n            </>\n          )}\n\n          {/* RECONCILIATION SUMMARY TAB */}'
    ))

    # 7) Reconciliation filters onChange
    replacements.append((
        '                    id="recon-village-select"\n                    value={filterVillage}\n                    onChange={(e) => setFilterVillage(e.target.value)}',
        '                    id="recon-village-select"\n                    value={filterVillage}\n                    onChange={(e) => {\n                      setFilterVillage(e.target.value);\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="recon-batch-id-select"\n                    value={filterBatchId}\n                    onChange={(e) => setFilterBatchId(e.target.value)}',
        '                    id="recon-batch-id-select"\n                    value={filterBatchId}\n                    onChange={(e) => {\n                      setFilterBatchId(e.target.value);\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))
    replacements.append((
        '                    id="recon-type-select"\n                    value={filterReconType}\n                    onChange={(e) => setFilterReconType(e.target.value as \'All\' | \'Distributions\' | \'Returns\')}',
        '                    id="recon-type-select"\n                    value={filterReconType}\n                    onChange={(e) => {\n                      setFilterReconType(e.target.value as \'All\' | \'Distributions\' | \'Returns\');\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))

    # 8) Reconciliation table mapping & pagination controls
    replacements.append((
        '                      filteredReconciliation.map((item) => (',
        '                      (isPrinting ? filteredReconciliation : filteredReconciliation.slice((getPage(\'reconciliation\') - 1) * 10, getPage(\'reconciliation\') * 10)).map((item) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            </>\n          )}\n\n          {/* REPORTS LOGS TAB RENDER */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="reconciliation"\n                  totalItems={filteredReconciliation.length}\n                />\n              </div>\n            </>\n          )}\n\n          {/* REPORTS LOGS TAB RENDER */}'
    ))

    # 9) Finance period buttons onClick
    replacements.append((
        "                      onClick={() => setFinancePeriod('day')}",
        "                      onClick={() => {\n                        setFinancePeriod('day');\n                        setPage('finRebuyProd', 1);\n                        setPage('finRatio', 1);\n                        setPage('finFunding', 1);\n                        setPage('finCashFlow', 1);\n                      }}"
    ))
    replacements.append((
        "                      onClick={() => setFinancePeriod('week')}",
        "                      onClick={() => {\n                        setFinancePeriod('week');\n                        setPage('finRebuyProd', 1);\n                        setPage('finRatio', 1);\n                        setPage('finFunding', 1);\n                        setPage('finCashFlow', 1);\n                      }}"
    ))
    replacements.append((
        "                      onClick={() => setFinancePeriod('month')}",
        "                      onClick={() => {\n                        setFinancePeriod('month');\n                        setPage('finRebuyProd', 1);\n                        setPage('finRatio', 1);\n                        setPage('finFunding', 1);\n                        setPage('finCashFlow', 1);\n                      }}"
    ))
    replacements.append((
        "                      onClick={() => setFinancePeriod('all')}",
        "                      onClick={() => {\n                        setFinancePeriod('all');\n                        setPage('finRebuyProd', 1);\n                        setPage('finRatio', 1);\n                        setPage('finFunding', 1);\n                        setPage('finCashFlow', 1);\n                      }}"
    ))

    # 10) Re-buy vs Production table mapping & pagination controls
    replacements.append((
        '                          modelFinanceData.map((item) => {',
        '                          (isPrinting ? modelFinanceData : modelFinanceData.slice((getPage(\'finRebuyProd\') - 1) * 10, getPage(\'finRebuyProd\') * 10)).map((item) => {'
    ))
    replacements.append((
        '                    </table>\n                  </div>\n                </div>\n\n                {/* BATCH-SPECIFIC RE-BUY & PRODUCTION RATIO TABLE */}',
        '                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="finRebuyProd"\n                    totalItems={modelFinanceData.length}\n                  />\n                </div>\n\n                {/* BATCH-SPECIFIC RE-BUY & PRODUCTION RATIO TABLE */}'
    ))

    # 11) Batch-specific Ratio table mapping & pagination controls
    replacements.append((
        '                          batchFinanceData.map((item) => {',
        '                          (isPrinting ? batchFinanceData : batchFinanceData.slice((getPage(\'finRatio\') - 1) * 10, getPage(\'finRatio\') * 10)).map((item) => {'
    ))
    replacements.append((
        '                    </table>\n                  </div>\n                </div>\n              </div>\n\n              <div className="table-panel">',
        '                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="finRatio"\n                    totalItems={batchFinanceData.length}\n                  />\n                </div>\n              </div>\n\n              <div className="table-panelclose_placeholder"'
    ))
    replacements.append((
        '              <div className="table-panelclose_placeholder"',
        '              <div className="table-panel">'
    ))

    # 12) Outpost Funding Summary table mapping & pagination controls
    replacements.append((
        '                        ) : (\n                          villages.map((v) => {\n                             const sum = villageFundingSummaryMap[v.name] || { disbursements: 0, repayments: 0, balance: 0 };',
        '                        ) : (\n                          (isPrinting ? villages : villages.slice((getPage(\'finFunding\') - 1) * 10, getPage(\'finFunding\') * 10)).map((v) => {\n                             const sum = villageFundingSummaryMap[v.name] || { disbursements: 0, repayments: 0, balance: 0 };'
    ))
    replacements.append((
        '                    </table>\n                  </div>\n                </div>\n\n                {/* LOG FORM (Admin Only) */}',
        '                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="finFunding"\n                    totalItems={villages.length}\n                  />\n                </div>\n\n                {/* LOG FORM (Admin Only) */}'
    ))

    # 13) Cash Flow Ledger History table mapping & pagination controls
    replacements.append((
        '                        fundingList.map((f) => (',
        '                        (isPrinting ? fundingList : fundingList.slice((getPage(\'finCashFlow\') - 1) * 10, getPage(\'finCashFlow\') * 10)).map((f) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            </>\n          )}\n        </div>\n\n        {/* REPORTS TAB RENDER */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="finCashFlow"\n                  totalItems={fundingList.length}\n                />\n              </div>\n            </>\n          )}\n        </div>\n\n        {/* REPORTS TAB RENDER */}'
    ))

    # 14) Distribution & Left Report Table mapping & pagination controls
    replacements.append((
        '                              reportFilteredRecon.map((item: any) => (',
        '                              (isPrinting ? reportFilteredRecon : reportFilteredRecon.slice((getPage(\'repRecon\') - 1) * 10, getPage(\'repRecon\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                        </table>\n                      </div>\n                    </div>\n                  )\n                ) : (',
        '                        </table>\n                      </div>\n                      <PaginationControls\n                        tableKey="repRecon"\n                        totalItems={reportFilteredRecon.length}\n                      />\n                    </div>\n                  )\n                ) : ('
    ))

    # 15) Production Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.productions.map((item: any) => (',
        '                                  (isPrinting ? reportData.productions : reportData.productions.slice((getPage(\'repProd\') - 1) * 10, getPage(\'repProd\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                            </table>\n                          </div>\n                        </div>\n                      )}',
        '                            </table>\n                          </div>\n                          <PaginationControls\n                            tableKey="repProd"\n                            totalItems={reportData.productions.length}\n                          />\n                        </div>\n                      )}'
    ))

    # 16) Distribution Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.distributions.map((item: any) => (',
        '                                  (isPrinting ? reportData.distributions : reportData.distributions.slice((getPage(\'repDist\') - 1) * 10, getPage(\'repDist\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                            </table>\n                          </div>\n                        </div>\n                      )}',
        '                            </table>\n                          </div>\n                          <PaginationControls\n                            tableKey="repDist"\n                            totalItems={reportData.distributions.length}\n                          />\n                        </div>\n                      )}'
    ))

    # 17) Returns Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.returns.map((item: any) => (',
        '                                  (isPrinting ? reportData.returns : reportData.returns.slice((getPage(\'repRet\') - 1) * 10, getPage(\'repRet\') * 10)).map((item: any) => ('
    ))
    # Note: to avoid breaking compile on )), we just replace inside the table element itself!
    replacements.append((
        '                              </table>\n                            </div>\n                          </div>\n                        )}',
        '                              </table>\n                            </div>\n                            <PaginationControls\n                              tableKey="repRet"\n                              totalItems={reportData.returns.length}\n                            />\n                          </div>\n                        )}'
    ))

    # 18) Central Pipes Catalog mapping & pagination controls
    replacements.append((
        '                        pipeTypes.map((pipe) => (',
        '                        (isPrinting ? pipeTypes : pipeTypes.slice((getPage(\'catalogPipes\') - 1) * 10, getPage(\'catalogPipes\') * 10)).map((pipe) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n\n              {/* Right Column: Outpost Registry CRUD */}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="catalogPipes"\n                  totalItems={pipeTypes.length}\n                />\n              </div>\n\n              {/* Right Column: Outpost Registry CRUD */}'
    ))

    # 19) Village Outpost Registry mapping & pagination controls
    replacements.append((
        '                      ) : (\n                        villages.map((v) => (\n                          <tr key={v.id}>',
        '                      ) : (\n                        (isPrinting ? villages : villages.slice((getPage(\'catalogVillages\') - 1) * 10, getPage(\'catalogVillages\') * 10)).map((v) => (\n                          <tr key={v.id}>'
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n\n            </div>\n          )}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="catalogVillages"\n                  totalItems={villages.length}\n                />\n              </div>\n\n            </div>\n          )}'
    ))

    # 20) Operational System Audit Trail mapping & pagination controls
    replacements.append((
        '                      auditLogs.map((log) => (',
        '                      (isPrinting ? auditLogs : auditLogs.slice((getPage(\'auditLogs\') - 1) * 10, getPage(\'auditLogs\') * 10)).map((log) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            )}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="auditLogs"\n                  totalItems={auditLogs.length}\n                />\n              </div>\n            )}'
    ))

    # 21) Database Snapshots mapping & pagination controls
    replacements.append((
        '                      backups.map((b) => (',
        '                      (isPrinting ? backups : backups.slice((getPage(\'backups\') - 1) * 10, getPage(\'backups\') * 10)).map((b) => ('
    ))
    replacements.append((
        '                  </table>\n                </div>\n              </div>\n            )}',
        '                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="backups"\n                  totalItems={backups.length}\n                />\n              </div>\n            )}'
    ))

    # 22) Modal Production details table (wrap inside fragments <> ... </>)
    replacements.append((
        '                          {viewingBatchDetails.productions.map((p) => (',
        '                          {(isPrinting ? viewingBatchDetails.productions : viewingBatchDetails.productions.slice((getPage(\'modalProd\') - 1) * 10, getPage(\'modalProd\') * 10)).map((p) => ('
    ))
    replacements.append((
        '                  ) : (\n                    <div className="table-wrapper">\n                      <table>',
        '                  ) : (\n                    <>\n                    <div className="table-wrapper">\n                      <table>'
    ))
    replacements.append((
        '                      </table>\n                    </div>\n                  )}\n                </div>\n\n                <div style={{ marginBottom: \'24px\' }}>',
        '                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalProd"\n                      totalItems={viewingBatchDetails.productions.length}\n                    />\n                    </>\n                  )}\n                </div>\n\n                <div style={{ marginBottom: \'24px\' }}>'
    ))

    # 23) Modal Distribution details table (wrap inside fragments <> ... </>)
    replacements.append((
        '                          {viewingBatchDetails.distributions.map((d) => (',
        '                          {(isPrinting ? viewingBatchDetails.distributions : viewingBatchDetails.distributions.slice((getPage(\'modalDist\') - 1) * 10, getPage(\'modalDist\') * 10)).map((d) => ('
    ))
    replacements.append((
        '                  ) : (\n                    <div className="table-wrapper">\n                      <table>',
        '                  ) : (\n                    <>\n                    <div className="table-wrapper">\n                      <table>'
    ))
    # Wait, the above replacement for `) : (` might conflict with the productions modal since they both use this target string!
    # Let's write unique target strings for distributions and returns modal table wrapper headers:
    # Production modal wrapper:
    # Distribution modal wrapper:
    # We will use unique context headers for modal:
    # productions modal start:
    # distributions modal start:
    # returns modal start:

    # Let's clean this up and write the exact unique blocks!
    # Productions modal table:
    # Target:
    # `                  {viewingBatchDetails.productions.length === 0 ? (
    #                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ထုတ်လုပ်မှု မှတ်တမ်း မရှိပါ။' : 'No production records found.'}</p>
    #                   ) : (
    #                     <div className="table-wrapper">`
    # Replacement:
    # `                  {viewingBatchDetails.productions.length === 0 ? (
    #                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{language === 'my' ? 'ထုတ်လုပ်မှု မှတ်တမ်း မရှိပါ။' : 'No production records found.'}</p>
    #                   ) : (
    #                     <>
    #                     <div className="table-wrapper">`
    # (And same for distributions and returns)
    replacements.append((
        '                  {viewingBatchDetails.productions.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ထုတ်လုပ်မှု မှတ်တမ်း မရှိပါ။\' : \'No production records found.\'}</p>\n                  ) : (\n                    <div className="table-wrapper">',
        '                  {viewingBatchDetails.productions.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ထုတ်လုပ်မှု မှတ်တမ်း မရှိပါ။\' : \'No production records found.\'}</p>\n                  ) : (\n                    <>\n                    <div className="table-wrapper">'
    ))
    replacements.append((
        '                              <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                  )}',
        '                              <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalProd"\n                      totalItems={viewingBatchDetails.productions.length}\n                    />\n                    </>\n                  )}'
    ))

    # Distributions modal table:
    replacements.append((
        '                  {viewingBatchDetails.distributions.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ဖြန့်ဖြူးမှု မှတ်တမ်း မရှိပါ။\' : \'No distribution records found.\'}</p>\n                  ) : (\n                    <div className="table-wrapper">',
        '                  {viewingBatchDetails.distributions.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ဖြန့်ဖြူးမှု မှတ်တမ်း မရှိပါ။\' : \'No distribution records found.\'}</p>\n                  ) : (\n                    <>\n                    <div className="table-wrapper">'
    ))
    replacements.append((
        '                              <td style={{ fontSize: \'0.85rem\' }}>{d.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                  )}',
        '                              <td style={{ fontSize: \'0.85rem\' }}>{d.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalDist"\n                      totalItems={viewingBatchDetails.distributions.length}\n                    />\n                    </>\n                  )}'
    ))

    # Returns modal table:
    replacements.append((
        '                  {viewingBatchDetails.returns.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ပြန်လည်အပ်နှံမှု မှတ်တမ်း မရှိပါ။\' : \'No return records found.\'}</p>\n                  ) : (\n                    <div className="table-wrapper">',
        '                  {viewingBatchDetails.returns.length === 0 ? (\n                    <p style={{ color: \'var(--text-secondary)\', fontSize: \'0.9rem\' }}>{language === \'my\' ? \'ပြန်လည်အပ်နှံမှု မှတ်တမ်း မရှိပါ။\' : \'No return records found.\'}</p>\n                  ) : (\n                    <>\n                    <div className="table-wrapper">'
    ))
    replacements.append((
        '                              <td style={{ fontSize: \'0.85rem\' }}>{r.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                  )}',
        '                              <td style={{ fontSize: \'0.85rem\' }}>{r.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalRet"\n                      totalItems={viewingBatchDetails.returns.length}\n                    />\n                    </>\n                  )}'
    ))

    # Perform all replacements
    success_count = 0
    fail_count = 0
    for idx, (target, replacement) in enumerate(replacements):
        if target in content:
            content = content.replace(target, replacement, 1)
            success_count += 1
        else:
            print(f"Replacement {idx} failed to find target content.")
            fail_count += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Applied {success_count} replacements. {fail_count} failed.")

if __name__ == '__main__':
    apply_replacements()
