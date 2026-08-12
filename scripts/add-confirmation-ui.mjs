import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");

const simulationEnd = `</div></section>}
        </div>`;
const simulationReplacement = `</div><button className="btn btn-dark full confirm-purchase-btn" onClick={() => { setSelectedTerms(dueDates.map((scenario) => scenario.term)); setShowConfirm(true); }}>Confirmar compra nesses prazos</button></section>}
        </div>`;
if (!source.includes(simulationEnd)) throw new Error("Bloco da simulação não localizado");
source = source.replace(simulationEnd, simulationReplacement);

const modalAnchor = `      {showAdd && <div className="modal-backdrop">`;
const confirmationModal = `      {showConfirm && <div className="modal-backdrop"><div className="modal-light confirmation-modal"><div className="modal-title"><div><p className="eyebrow">Reprocessar fluxo</p><h2>Confirmar compra</h2></div><button className="icon-btn" onClick={() => setShowConfirm(false)}><X size={18}/></button></div><p className="modal-description">Selecione os prazos que foram confirmados. As parcelas escolhidas entram no fluxo nas datas previstas e ficam temporárias por 7 dias.</p><div className="confirmation-terms">{dueDates.map((scenario) => <label className="confirmation-term" key={scenario.term}><input type="checkbox" checked={selectedTerms.includes(scenario.term)} onChange={(e) => setSelectedTerms((current) => e.target.checked ? [...current, scenario.term] : current.filter((term) => term !== scenario.term))}/><span><strong>{scenario.term} dias</strong><small>{dateBR(scenario.date)} · {money(scenario.installment)}</small></span></label>)}</div><div className="modal-actions"><button className="btn btn-light" onClick={() => setShowConfirm(false)}>Cancelar</button><button className="btn btn-dark" onClick={confirmPurchase}>Confirmar e atualizar fluxo</button></div></div></div>}
${modalAnchor}`;
if (!source.includes(modalAnchor)) throw new Error("Âncora dos modais não localizada");
source = source.replace(modalAnchor, confirmationModal);

fs.writeFileSync(path, source);
