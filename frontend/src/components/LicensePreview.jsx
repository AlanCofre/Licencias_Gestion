import React from "react";

export default function LicensePreview({ file }) {
  if (!file) return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;

  const { url, filename, mimetype } = file;
  const isImage = mimetype?.startsWith?.("image/") || /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const isPDF = mimetype === "application/pdf" || /\.pdf$/i.test(filename);

  return (
    <div className="space-y-3">
      <div className="border rounded overflow-hidden">
        {isPDF ? (
          <iframe title={filename} src={url} className="w-full h-80" />
        ) : isImage ? (
          <img src={url} alt={filename} className="w-full object-contain max-h-80" />
        ) : (
          <div className="p-4 text-sm">{filename}</div>
        )}
      </div>

      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Previsualizar</a>
        <a href={url} download={filename} className="px-3 py-2 bg-gray-100 rounded">Descargar</a>
      </div>
    </div>
  );
}