import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

export function useEditor(projectId: string | undefined) {
  const id = projectId ? parseInt(projectId) : undefined;
  
  const { data: project, isLoading: isLoadingProject } = trpc.projects.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: latestVersion, isLoading: isLoadingVersion, refetch } = trpc.documents.getLatest.useQuery(
    { projectId: id! },
    { enabled: !!id }
  );

  const createDocumentMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const [content, setContent] = useState("");

  useEffect(() => {
    if (latestVersion) {
      setContent(latestVersion.content);
    }
  }, [latestVersion]);

  const saveDocument = async (newContent: string) => {
    if (!id) return;
    await createDocumentMutation.mutateAsync({
      projectId: id,
      content: newContent,
    });
  };

  return {
    project,
    content,
    isLoading: isLoadingProject || isLoadingVersion,
    error: null,
    saveDocument,
    isSaving: createDocumentMutation.isPending,
  };
}
