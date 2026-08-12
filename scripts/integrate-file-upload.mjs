import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");

source = source.replace(
  'import { useEffect, useMemo, useState } from "react";\n',
  'import { useEffect, useMemo, useState } from "react";\nimport { useAuth } from "@/_core/hooks/useAuth";\nimport { trpc } from "@/lib/trpc";\n'
);
source = source.replace(
  '  let { user, loading, error, isAuthenticated, logout } = useAuth();\n',
  '  const { user, loading, error, isAuthenticated, logout } = useAuth();\n  const uploadFile = trpc.files.upload.useMutation();\n'
);
source = source.replace(
  'const wb = XLSX.read(reader.result, { type: "array", cellDates: true });',
  'const arrayBuffer = reader.result as ArrayBuffer; const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });'
);
const marker = 'if (!imported.length) throw new Error("Nenhum débito válido encontrado");';
const uploadCode = `${marker} const bytes = new Uint8Array(arrayBuffer); let binary = ""; const chunkSize = 0x8000; for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize)); uploadFile.mutate({ fileName: file.name, mimeType: file.type || "application/octet-stream", byteSize: bytes.byteLength, base64: btoa(binary) }, { onError: () => toast.error("O fluxo foi atualizado, mas não foi possível armazenar a planilha no servidor.") });`;
if (!source.includes(marker)) throw new Error("Import parser marker not found");
source = source.replace(marker, uploadCode);
fs.writeFileSync(path, source);
