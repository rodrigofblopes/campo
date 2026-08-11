// Controle de desbloqueio da área de Produtividade (protegida por senha),
// compartilhado entre o gate (produtividade)/layout.tsx e o cadeado que
// aparece no menu (NavContent.tsx). Usa sessionStorage + um evento
// customizado para sincronizar as duas instâncias na mesma aba.

const EVENTO_DESBLOQUEIO = "campo:produtividade-unlocked";

export function chaveSessaoProdutividade(obraId: string): string {
  return `campo-obra-unlock-${obraId}`;
}

export function desbloquearProdutividade(obraId: string): void {
  sessionStorage.setItem(chaveSessaoProdutividade(obraId), "ok");
  window.dispatchEvent(new Event(EVENTO_DESBLOQUEIO));
}

export function subscribeProdutividade(callback: () => void): () => void {
  window.addEventListener(EVENTO_DESBLOQUEIO, callback);
  return () => window.removeEventListener(EVENTO_DESBLOQUEIO, callback);
}

export function produtividadeLiberadaSnapshot(obraId: string): () => boolean {
  return () => sessionStorage.getItem(chaveSessaoProdutividade(obraId)) === "ok";
}

export function produtividadeLiberadaSnapshotServidor(): boolean {
  return false;
}
