"use client";

import { useEffect, useRef } from "react";
import { completeCreatorSession } from "@/app/actions/auth";

export function CreatorSessionComplete({ token }: { token: string }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void completeCreatorSession(token);
  }, [token]);

  return (
    <p className="text-sm text-muted-foreground" role="status">
      Completing signin…
    </p>
  );
}
