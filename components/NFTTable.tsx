"use client";

interface NFTTableProps {
  items: any[];
}

export default function NFTTable({ items }: NFTTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No NFTs found
      </div>
    );
  }

  const allColumns = [
  { key: "nft_title", label: "Title" },
  { key: "nft_description", label: "Description" },
  { key: "nft_serial_number", label: "Serial" },
  { key: "platform", label: "Platform" },
  { key: "collection", label: "Collection" },
  { key: "series", label: "Series" },
  { key: "type", label: "Type" },
  { key: "rarity", label: "Rarity" },
  { key: "minted_level", label: "Minted Level" },
  { key: "edition_size", label: "Edition Size" },
  { key: "artist", label: "Artist" },
  { key: "copyright", label: "Copyright" },
];


  const visibleColumns = allColumns.filter((col) =>
    items.some((item) => item[col.key] !== null && item[col.key] !== "")
  );

  return (
    <table className="w-full border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          {visibleColumns.map((col) => (
            <th key={col.key} className="border border-gray-300 px-2 py-1">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, rowIndex) => (
          <tr key={rowIndex} className="border border-gray-300">
            {visibleColumns.map((col) => (
              <td key={col.key} className="border border-gray-300 px-2 py-1">
                {item[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
