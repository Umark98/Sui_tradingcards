interface ItemListProps {
  items: { nft_title: string; nft_description: string }[];
}

export default function ItemList({ items }: ItemListProps) {
  if (!items.length) return <p className="mt-4 text-gray-500">No NFTs found</p>;

  return (
    <ul className="mt-6 space-y-4 w-full">
      {items.map((item, idx) => (
        <li key={idx} className="p-4 border rounded-lg shadow-sm text-left">
          <h2 className="font-semibold">{item.nft_title}</h2>
          <p className="text-gray-600">{item.nft_description}</p>
        </li>
      ))}
    </ul>
  );
}
