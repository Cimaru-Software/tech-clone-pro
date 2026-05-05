import { useNavigate, useParams } from "@/lib/router";
import { useEffect } from "react";

export default function ProductRedirect() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/producto/$id", params: { id }, replace: true });
  }, [id, navigate]);

  return (
    <div className="container-x py-10">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-secondary rounded-xl" />
        <div className="space-y-4">
          <div className="h-4 bg-secondary rounded w-1/4" />
          <div className="h-7 bg-secondary rounded w-3/4" />
          <div className="h-7 bg-secondary rounded w-1/2" />
          <div className="h-10 bg-secondary rounded w-1/3" />
          <div className="h-12 bg-secondary rounded w-full mt-8" />
        </div>
      </div>
    </div>
  );
}
