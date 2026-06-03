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
    replacements.append((
        '                      productions\n                        .filter(p => (p.batch_id || \'\').toLowerCase().includes(searchBatchId.toLowerCase()))\n                        .map((prod) => {',
        '                      (() => {\n                        const filtered = productions.filter(p => (p.batch_id || \'\').toLowerCase().includes(searchBatchId.toLowerCase()));\n                        return (isPrinting ? filtered : filtered.slice((getPage(\'production\') - 1) * 10, getPage(\'production\') * 10)).map((prod) => {'
    ))

    replacements.append((
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/production?id=${prod.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                          </tr>\n                        );\n                      })\n                    )}\n                  </tbody>\n                </table>\n              </div>\n            </div>',
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/production?id=${prod.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                          </tr>\n                        );\n                      });\n                      })()\n                    )}\n                  </tbody>\n                </table>\n              </div>\n              <PaginationControls\n                tableKey="production"\n                totalItems={productions.filter(p => (p.batch_id || \'\').toLowerCase().includes(searchBatchId.toLowerCase())).length}\n              />\n            </div>'
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
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/distribution?id=${item.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/distribution?id=${item.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="distribution"\n                  totalItems={filteredDistributions.length}\n                />\n              </div>'
    ))

    # 5) Returns filters onChange
    replacements.append((
        '                    value={filterVillage}\n                    onChange={(e) => setFilterVillage(e.target.value)}',
        '                    value={filterVillage}\n                    onChange={(e) => {\n                      setFilterVillage(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterPipeType}\n                    onChange={(e) => setFilterPipeType(e.target.value)}',
        '                    value={filterPipeType}\n                    onChange={(e) => {\n                      setFilterPipeType(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterBatchId}\n                    onChange={(e) => setFilterBatchId(e.target.value)}',
        '                    value={filterBatchId}\n                    onChange={(e) => {\n                      setFilterBatchId(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterStatus}\n                    onChange={(e) => setFilterStatus(e.target.value)}',
        '                    value={filterStatus}\n                    onChange={(e) => {\n                      setFilterStatus(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterStartDate}\n                    onChange={(e) => setFilterStartDate(e.target.value)}',
        '                    value={filterStartDate}\n                    onChange={(e) => {\n                      setFilterStartDate(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterEndDate}\n                    onChange={(e) => setFilterEndDate(e.target.value)}',
        '                    value={filterEndDate}\n                    onChange={(e) => {\n                      setFilterEndDate(e.target.value);\n                      setPage(\'returns\', 1);\n                    }}'
    ))

    # 6) Returns table mapping & pagination controls
    replacements.append((
        '                      filteredReturns.map((item) => (',
        '                      (isPrinting ? filteredReturns : filteredReturns.slice((getPage(\'returns\') - 1) * 10, getPage(\'returns\') * 10)).map((item) => ('
    ))
    replacements.append((
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/returns?id=${item.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                            {user.role === \'admin\' && <td>{formatCurrency(item.price || 0)}</td>}\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                                  <button\n                                    type="button"\n                                    className="action-btn delete"\n                                    onClick={() => deleteRecord(`/api/returns?id=${item.id}`, t.confirmDeleteRecord)}\n                                  >\n                                    {t.delete}\n                                  </button>\n                                </div>\n                              </td>\n                            )}\n                            {user.role === \'admin\' && <td>{formatCurrency(item.price || 0)}</td>}\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="returns"\n                  totalItems={filteredReturns.length}\n                />\n              </div>'
    ))

    # 7) Reconciliation filters onChange
    replacements.append((
        '                    value={filterVillage}\n                    onChange={(e) => setFilterVillage(e.target.value)}',
        '                    value={filterVillage}\n                    onChange={(e) => {\n                      setFilterVillage(e.target.value);\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterBatchId}\n                    onChange={(e) => setFilterBatchId(e.target.value)}',
        '                    value={filterBatchId}\n                    onChange={(e) => {\n                      setFilterBatchId(e.target.value);\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))
    replacements.append((
        '                    value={filterReconType}\n                    onChange={(e) => setFilterReconType(e.target.value as \'All\' | \'Distributions\' | \'Returns\')}',
        '                    value={filterReconType}\n                    onChange={(e) => {\n                      setFilterReconType(e.target.value as \'All\' | \'Distributions\' | \'Returns\');\n                      setPage(\'reconciliation\', 1);\n                    }}'
    ))

    # 8) Reconciliation table mapping & pagination controls
    replacements.append((
        '                      filteredReconciliation.map((item) => (',
        '                      (isPrinting ? filteredReconciliation : filteredReconciliation.slice((getPage(\'reconciliation\') - 1) * 10, getPage(\'reconciliation\') * 10)).map((item) => ('
    ))
    replacements.append((
        '                            <td>\n                              {item.returnDate ? (\n                                <span style={{ color: \'var(--text-secondary)\' }}>{item.returnDate}</span>\n                              ) : (\n                                <span style={{ fontStyle: \'italic\', color: \'var(--success)\', fontWeight: \'600\' }}>{t.fullyReturned}</span>\n                              )}\n                            </td>\n                            <td>{item.returnDate}</td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                            <td>\n                              {item.returnDate ? (\n                                <span style={{ color: \'var(--text-secondary)\' }}>{item.returnDate}</span>\n                              ) : (\n                                <span style={{ fontStyle: \'italic\', color: \'var(--success)\', fontWeight: \'600\' }}>{t.fullyReturned}</span>\n                              )}\n                            </td>\n                            <td>{item.returnDate}</td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="reconciliation"\n                  totalItems={filteredReconciliation.length}\n                />\n              </div>'
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
        '                              <td>\n                                <span className={isPositiveDiff ? \'text-success\' : \'text-danger\'} style={{ fontWeight: \'600\' }}>\n                                  {isPositiveDiff ? \'+\' : \'\'}{formatCurrency(item.priceDiff)}\n                                </span>\n                              </td>\n                            </tr>\n                          );\n                        })\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                              <td>\n                                <span className={isPositiveDiff ? \'text-success\' : \'text-danger\'} style={{ fontWeight: \'600\' }}>\n                                  {isPositiveDiff ? \'+\' : \'\'}{formatCurrency(item.priceDiff)}\n                                </span>\n                              </td>\n                            </tr>\n                          );\n                        })\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="finRebuyProd"\n                  totalItems={modelFinanceData.length}\n                />\n              </div>'
    ))

    # 11) Batch-specific Ratio table mapping & pagination controls
    replacements.append((
        '                          batchFinanceData.map((item) => {',
        '                          (isPrinting ? batchFinanceData : batchFinanceData.slice((getPage(\'finRatio\') - 1) * 10, getPage(\'finRatio\') * 10)).map((item) => {'
    ))
    replacements.append((
        '                                <td>\n                                  {item.totalRetQty > 0 ? (\n                                    <span style={{ fontWeight: \'600\', color: item.ratio > 100 ? \'var(--accent-red)\' : \'var(--success)\' }}>\n                                      {item.ratio.toFixed(1)}%\n                                    </span>\n                                  ) : (\n                                    <span style={{ color: \'var(--text-muted)\', fontSize: \'0.85rem\' }}>No returns</span>\n                                  )}\n                                </td>\n                              </tr>\n                            );\n                          })\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                </div>\n              </div>',
        '                                <td>\n                                  {item.totalRetQty > 0 ? (\n                                    <span style={{ fontWeight: \'600\', color: item.ratio > 100 ? \'var(--accent-red)\' : \'var(--success)\' }}>\n                                      {item.ratio.toFixed(1)}%\n                                    </span>\n                                  ) : (\n                                    <span style={{ color: \'var(--text-muted)\', fontSize: \'0.85rem\' }}>No returns</span>\n                                  )}\n                                </td>\n                              </tr>\n                            );\n                          })\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="finRatio"\n                    totalItems={batchFinanceData.length}\n                  />\n                </div>\n              </div>'
    ))

    # 12) Outpost Funding Summary table mapping & pagination controls
    replacements.append((
        '                        ) : (\n                          villages.map((v) => {\n                             const sum = villageFundingSummaryMap[v.name] || { disbursements: 0, repayments: 0, balance: 0 };\n                             return (\n                               <tr key={v.id}>',
        '                        ) : (\n                          (isPrinting ? villages : villages.slice((getPage(\'finFunding\') - 1) * 10, getPage(\'finFunding\') * 10)).map((v) => {\n                             const sum = villageFundingSummaryMap[v.name] || { disbursements: 0, repayments: 0, balance: 0 };\n                             return (\n                               <tr key={v.id}>'
    ))
    replacements.append((
        '                                 <td style={{ fontWeight: \'600\', color: sum.balance > 0 ? \'var(--warning)\' : \'var(--success)\' }}>\n                                   {formatCurrency(sum.balance)}\n                                 </td>\n                               </tr>\n                             );\n                           })\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                </div>',
        '                                 <td style={{ fontWeight: \'600\', color: sum.balance > 0 ? \'var(--warning)\' : \'var(--success)\' }}>\n                                   {formatCurrency(sum.balance)}\n                                 </td>\n                               </tr>\n                             );\n                           })\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="finFunding"\n                    totalItems={villages.length}\n                  />\n                </div>'
    ))

    # 13) Cash Flow Ledger History table mapping & pagination controls
    replacements.append((
        '                        fundingList.map((f) => (',
        '                        (isPrinting ? fundingList : fundingList.slice((getPage(\'finCashFlow\') - 1) * 10, getPage(\'finCashFlow\') * 10)).map((f) => ('
    ))
    replacements.append((
        '                                  onClick={() => deleteRecord(`/api/village-funding?id=${f.id}`, t.confirmDeleteRecord)}\n                                >\n                                  {t.delete}\n                                </button>\n                              ) : (\n                                <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                              )}\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                                  onClick={() => deleteRecord(`/api/village-funding?id=${f.id}`, t.confirmDeleteRecord)}\n                                >\n                                  {t.delete}\n                                </button>\n                              ) : (\n                                <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                              )}\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="finCashFlow"\n                  totalItems={fundingList.length}\n                />\n              </div>'
    ))

    # 14) Distribution & Left Report Table mapping & pagination controls
    replacements.append((
        '                              reportFilteredRecon.map((item: any) => (',
        '                              (isPrinting ? reportFilteredRecon : reportFilteredRecon.slice((getPage(\'repRecon\') - 1) * 10, getPage(\'repRecon\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                                  <td>{item.returnDate}</td>\n                                </tr>\n                              ))\n                            )}\n                          </tbody>\n                        </table>\n                      </div>\n                    </div>',
        '                                  <td>{item.returnDate}</td>\n                                </tr>\n                              ))\n                            )}\n                          </tbody>\n                        </table>\n                      </div>\n                      <PaginationControls\n                        tableKey="repRecon"\n                        totalItems={reportFilteredRecon.length}\n                      />\n                    </div>'
    ))

    # 15) Production Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.productions.map((item: any) => (',
        '                                  (isPrinting ? reportData.productions : reportData.productions.slice((getPage(\'repProd\') - 1) * 10, getPage(\'repProd\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                                      <td>{item.quantity} {language === \'my\' ? \'ယူနစ်\' : \'units\'}</td>\n                                    </tr>\n                                  ))\n                                )}\n                              </tbody>\n                            </table>\n                          </div>\n                        </div>',
        '                                      <td>{item.quantity} {language === \'my\' ? \'ယူနစ်\' : \'units\'}</td>\n                                    </tr>\n                                  ))\n                                )}\n                              </tbody>\n                            </table>\n                          </div>\n                          <PaginationControls\n                            tableKey="repProd"\n                            totalItems={reportData.productions.length}\n                          />\n                        </div>'
    ))

    # 16) Distribution Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.distributions.map((item: any) => (',
        '                                  (isPrinting ? reportData.distributions : reportData.distributions.slice((getPage(\'repDist\') - 1) * 10, getPage(\'repDist\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                                      <td style={{ fontSize: \'0.85rem\' }}>{item.remark || \'-\'}</td>\n                                    </tr>\n                                  ))\n                                )}\n                              </tbody>\n                            </table>\n                          </div>\n                        </div>',
        '                                      <td style={{ fontSize: \'0.85rem\' }}>{item.remark || \'-\'}</td>\n                                    </tr>\n                                  ))\n                                )}\n                              </tbody>\n                            </table>\n                          </div>\n                          <PaginationControls\n                            tableKey="repDist"\n                            totalItems={reportData.distributions.length}\n                          />\n                        </div>'
    ))

    # 17) Returns Summary Report Table mapping & pagination controls
    replacements.append((
        '                                  reportData.returns.map((item: any) => (',
        '                                  (isPrinting ? reportData.returns : reportData.returns.slice((getPage(\'repRet\') - 1) * 10, getPage(\'repRet\') * 10)).map((item: any) => ('
    ))
    replacements.append((
        '                                        <td>{formatCurrency(item.price || 0)}</td>\n                                        <td>{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>\n                                      </tr>\n                                    ))\n                                  )}\n                                </tbody>\n                              </table>\n                            </div>\n                          </div>',
        '                                        <td>{formatCurrency(item.price || 0)}</td>\n                                        <td>{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>\n                                      </tr>\n                                    ))\n                                  )}\n                                </tbody>\n                              </table>\n                            </div>\n                            <PaginationControls\n                              tableKey="repRet"\n                              totalItems={reportData.returns.length}\n                            />\n                          </div>'
    ))

    # 18) Central Pipes Catalog mapping & pagination controls
    replacements.append((
        '                        pipeTypes.map((pipe) => (',
        '                        (isPrinting ? pipeTypes : pipeTypes.slice((getPage(\'catalogPipes\') - 1) * 10, getPage(\'catalogPipes\') * 10)).map((pipe) => ('
    ))
    replacements.append((
        '                                      <button\n                                        type="button"\n                                        className="action-btn edit"\n                                        disabled={isSubmitting}\n                                        onClick={() => openEditPriceModal(pipe)}\n                                      >\n                                        {t.editPrice}\n                                      </button>\n                                    </>\n                                  ) : (\n                                    <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                                  )}\n                                </div>\n                              </td>\n                            </tr>\n                          ))\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                </div>',
        '                                      <button\n                                        type="button"\n                                        className="action-btn edit"\n                                        disabled={isSubmitting}\n                                        onClick={() => openEditPriceModal(pipe)}\n                                      >\n                                        {t.editPrice}\n                                      </button>\n                                    </>\n                                  ) : (\n                                    <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                                  )}\n                                </div>\n                              </td>\n                            </tr>\n                          ))\n                        )}\n                      </tbody>\n                    </table>\n                  </div>\n                  <PaginationControls\n                    tableKey="catalogPipes"\n                    totalItems={pipeTypes.length}\n                  />\n                </div>'
    ))

    # 19) Village Outpost Registry mapping & pagination controls
    replacements.append((
        '                      ) : (\n                        villages.map((v) => (\n                          <tr key={v.id}>',
        '                      ) : (\n                        (isPrinting ? villages : villages.slice((getPage(\'catalogVillages\') - 1) * 10, getPage(\'catalogVillages\') * 10)).map((v) => (\n                          <tr key={v.id}>'
    ))
    replacements.append((
        '                                  className="action-btn delete"\n                                  disabled={isSubmitting}\n                                  onClick={() => handleDeleteVillage(v.id)}\n                                >\n                                  {t.delete}\n                                </button>\n                              ) : (\n                                <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                              )}\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                                  className="action-btn delete"\n                                  disabled={isSubmitting}\n                                  onClick={() => handleDeleteVillage(v.id)}\n                                >\n                                  {t.delete}\n                                </button>\n                              ) : (\n                                <span style={{ fontSize: \'0.85rem\', color: \'var(--text-muted)\' }}>{t.locked}</span>\n                              )}\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="catalogVillages"\n                  totalItems={villages.length}\n                />\n              </div>'
    ))

    # 20) Operational System Audit Trail mapping & pagination controls
    replacements.append((
        '                      auditLogs.map((log) => (',
        '                      (isPrinting ? auditLogs : auditLogs.slice((getPage(\'auditLogs\') - 1) * 10, getPage(\'auditLogs\') * 10)).map((log) => ('
    ))
    replacements.append((
        '                          <td className="details-col" style={{ fontSize: \'0.9rem\', color: \'var(--text-secondary)\' }}>\n                            {log.details || \'None\'}\n                          </td>\n                        </tr>\n                      ))\n                    )}\n                  </tbody>\n                </table>\n              </div>\n            </div>',
        '                          <td className="details-col" style={{ fontSize: \'0.9rem\', color: \'var(--text-secondary)\' }}>\n                            {log.details || \'None\'}\n                          </td>\n                        </tr>\n                      ))\n                    )}\n                  </tbody>\n                </table>\n              </div>\n              <PaginationControls\n                tableKey="auditLogs"\n                totalItems={auditLogs.length}\n              />\n            </div>'
    ))

    # 21) Database Snapshots mapping & pagination controls
    replacements.append((
        '                      backups.map((b) => (',
        '                      (isPrinting ? backups : backups.slice((getPage(\'backups\') - 1) * 10, getPage(\'backups\') * 10)).map((b) => ('
    ))
    replacements.append((
        '                                  {t.delete}\n                                </button>\n                              </div>\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n              </div>',
        '                                  {t.delete}\n                                </button>\n                              </div>\n                            </td>\n                          </tr>\n                        ))\n                      )}\n                    </tbody>\n                  </table>\n                </div>\n                <PaginationControls\n                  tableKey="backups"\n                  totalItems={backups.length}\n                />\n              </div>'
    ))

    # 22) Modal Production details table
    replacements.append((
        '                          {viewingBatchDetails.productions.map((p) => (',
        '                          {(isPrinting ? viewingBatchDetails.productions : viewingBatchDetails.productions.slice((getPage(\'modalProd\') - 1) * 10, getPage(\'modalProd\') * 10)).map((p) => ('
    ))
    replacements.append((
        '                              <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>',
        '                              <td>{formatCurrency(viewingBatchDetails.basePrice)}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalProd"\n                      totalItems={viewingBatchDetails.productions.length}\n                    />'
    ))

    # 23) Modal Distribution details table
    replacements.append((
        '                          {viewingBatchDetails.distributions.map((d) => (',
        '                          {(isPrinting ? viewingBatchDetails.distributions : viewingBatchDetails.distributions.slice((getPage(\'modalDist\') - 1) * 10, getPage(\'modalDist\') * 10)).map((d) => ('
    ))
    replacements.append((
        '                              <td style={{ fontSize: \'0.85rem\' }}>{d.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>',
        '                              <td style={{ fontSize: \'0.85rem\' }}>{d.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalDist"\n                      totalItems={viewingBatchDetails.distributions.length}\n                    />'
    ))

    # 24) Modal Returns details table
    replacements.append((
        '                          {viewingBatchDetails.returns.map((r) => (',
        '                          {(isPrinting ? viewingBatchDetails.returns : viewingBatchDetails.returns.slice((getPage(\'modalRet\') - 1) * 10, getPage(\'modalRet\') * 10)).map((r) => ('
    ))
    replacements.append((
        '                              <td style={{ fontSize: \'0.85rem\' }}>{r.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>',
        '                              <td style={{ fontSize: \'0.85rem\' }}>{r.remark || \'-\'}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                    <PaginationControls\n                      tableKey="modalRet"\n                      totalItems={viewingBatchDetails.returns.length}\n                    />'
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
