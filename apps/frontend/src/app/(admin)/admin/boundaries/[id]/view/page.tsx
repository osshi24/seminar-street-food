import BoundaryDetailViewClient from './BoundaryDetailViewClient';

export default async function BoundaryDetailViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoundaryDetailViewClient id={id} />;
}
