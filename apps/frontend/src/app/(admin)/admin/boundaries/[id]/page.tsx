import BoundaryEditor from '../BoundaryEditor';

export default async function BoundaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoundaryEditor boundaryId={id} />;
}

