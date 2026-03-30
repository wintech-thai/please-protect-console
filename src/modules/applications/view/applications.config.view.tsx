"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Save, GitMerge, RefreshCcw, ChevronLeft, Loader } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { DiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { parse as parseYaml } from "yaml";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useConfirm } from "@/hooks/use-confirm";
import {
  useCurrentAppCustomConfig,
  useCurrentAppDefaultConfig,
  useDraftAppCustomConfig,
  useMergeDraftAppCustomConfig,
  useSaveDraftAppCustomConfig,
} from "../hooks/use-applications";
import { applicationDict } from "../applications.dict";
import { useParams, useRouter } from "next/navigation";

const monacoEditorOptions = {
  minimap: { enabled: false },
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  fontSize: 12,
  tabSize: 2,
  automaticLayout: true,
  smoothScrolling: true,
  scrollbar: {
    vertical: "visible" as const,
    horizontal: "visible" as const,
    alwaysConsumeMouseWheel: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
};

type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; invalidPaths?: string[] };

const MAX_INVALID_FIELDS_PREVIEW = 5;

function collectLeafPaths(
  input: unknown,
  parent = "",
  paths = new Set<string>(),
) {
  if (Array.isArray(input)) {
    for (const item of input) {
      const arrayPath = parent ? `${parent}.[]` : "[]";
      collectLeafPaths(item, arrayPath, paths);
    }
    return paths;
  }

  if (input !== null && typeof input === "object") {
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      const next = parent ? `${parent}.${key}` : key;
      collectLeafPaths(value, next, paths);
    }
    return paths;
  }

  if (parent) paths.add(parent);
  return paths;
}

function validateEditableYaml(
  yamlText: string,
  defaultConfigText: string,
  currentCustomConfigText: string,
): ValidationResult {
  let parsedEdited: unknown;
  let parsedDefault: unknown;
  let parsedCurrent: unknown;

  try {
    parsedEdited = parseYaml(yamlText || "");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid YAML format";
    return { ok: false, reason: `Invalid YAML in editor: ${message}` };
  }

  try {
    parsedDefault = parseYaml(defaultConfigText || "");
  } catch {
    return {
      ok: false,
      reason: "Cannot validate fields because default config YAML is invalid",
    };
  }

  try {
    parsedCurrent = parseYaml(currentCustomConfigText || "");
  } catch {
    return {
      ok: false,
      reason: "Cannot validate fields because current config YAML is invalid",
    };
  }

  const allowed = new Set<string>([
    ...collectLeafPaths(parsedDefault),
    ...collectLeafPaths(parsedCurrent),
  ]);
  const edited = collectLeafPaths(parsedEdited);

  const invalidPaths = [...edited].filter((path) => !allowed.has(path));
  if (invalidPaths.length > 0) {
    return {
      ok: false,
      reason:
        "Found fields that are not allowed by current/default configuration",
      invalidPaths,
    };
  }

  return { ok: true };
}

const ApplicationConfigViewPage = () => {
  const { app: appName } = useParams<{ app: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const t =
    applicationDict[language as keyof typeof applicationDict] ||
    applicationDict.EN;

  const [draftYaml, setDraftYaml] = useState("");
  const [hasLocalChange, setHasLocalChange] = useState(false);

  const defaultEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(
    null,
  );
  const draftEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(
    null,
  );

  useEffect(() => {
    const relayout = () => {
      defaultEditorRef.current?.layout();
      draftEditorRef.current?.layout();
    };

    window.addEventListener("resize", relayout);
    return () => window.removeEventListener("resize", relayout);
  }, []);

  const { data: defaultConfig, refetch: refetchDefault } =
    useCurrentAppDefaultConfig(appName, {
      placeholderData: keepPreviousData,
    });

  const { data: currentCustomConfig, refetch: refetchCurrent } =
    useCurrentAppCustomConfig(appName, { placeholderData: keepPreviousData });

  const { data: draftConfig, refetch: refetchDraft } = useDraftAppCustomConfig(
    appName,
    { placeholderData: keepPreviousData },
  );
  const hasDefaultConfig = typeof defaultConfig === "string";
  const hasCurrentCustomConfig = typeof currentCustomConfig === "string";
  const hasDraftConfig = typeof draftConfig === "string";
  const canRenderDraftEditor = hasDraftConfig || hasLocalChange;
  const canRenderDiffEditor = hasCurrentCustomConfig && canRenderDraftEditor;
  const canValidateConfig = hasDefaultConfig && hasCurrentCustomConfig;
  const canRunConfigActions = canValidateConfig && canRenderDraftEditor;

  const saveDraftMutation = useSaveDraftAppCustomConfig();
  const mergeDraftMutation = useMergeDraftAppCustomConfig();

  const [MergeConfirmDialog, confirmMerge] = useConfirm({
    title: t.config.confirm.mergeTitle,
    message: t.config.confirm.mergeMessage,
    variant: "default",
    confirmButton: t.config.confirm.confirmMerge,
    cancelButton: t.config.confirm.cancel,
  });

  const [SaveConfirmDialog, confirmSave] = useConfirm({
    title: t.config.confirm.saveTitle,
    message: t.config.confirm.saveMessage,
    variant: "default",
    confirmButton: t.config.confirm.confirmSave,
    cancelButton: t.config.confirm.cancel,
  });

  const editableDraft = hasLocalChange ? draftYaml : draftConfig || "";

  const editorValueForDiff = useMemo(
    () => (hasLocalChange ? draftYaml : editableDraft),
    [draftYaml, editableDraft, hasLocalChange],
  );

  const refreshAll = async () => {
    await Promise.all([refetchDefault(), refetchCurrent(), refetchDraft()]);
    setHasLocalChange(false);
    toast.success(t.config.toast.reloadSuccess);
  };

  const handleResetDraft = () => {
    setDraftYaml(draftConfig || "");
    setHasLocalChange(false);
  };

  const runConfigValidation = () => {
    if (!canRunConfigActions) {
      toast.error(t.config.toast.loadingConfigNotReady);
      return null;
    }

    const validation = validateEditableYaml(
      editableDraft,
      defaultConfig || "",
      currentCustomConfig || "",
    );

    if (!validation.ok) {
      const reason = validation.invalidPaths?.length
        ? t.config.toast.invalidFields
        : validation.reason;
      const suffix = validation.invalidPaths?.length
        ? `: ${validation.invalidPaths
            .slice(0, MAX_INVALID_FIELDS_PREVIEW)
            .join(", ")}${validation.invalidPaths.length > MAX_INVALID_FIELDS_PREVIEW ? " ..." : ""}`
        : "";
      toast.error(`${reason}${suffix}`);
      return null;
    }

    return validation;
  };

  const handleSaveDraft = async () => {
    const validation = runConfigValidation();
    if (!validation) return;

    const ok = await confirmSave();
    if (!ok) return;

    await saveDraftMutation.mutateAsync({
      appName,
      yamlContent: editableDraft,
    });
    setHasLocalChange(false);
    toast.success(t.config.toast.saveSuccess);
    await refetchDraft();
  };

  const handleMergeDraft = async () => {
    const validation = runConfigValidation();
    if (!validation) return;

    const ok = await confirmMerge();
    if (!ok) return;

    await mergeDraftMutation.mutateAsync(appName);
    toast.success(t.config.toast.mergeSuccess);
    setHasLocalChange(false);
    await Promise.all([refetchCurrent(), refetchDraft()]);
  };

  return (
    <div className="flex flex-col h-full text-slate-200 relative font-sans">
      <MergeConfirmDialog />
      <SaveConfirmDialog />

      {/* Header */}
      <div className="flex-none pt-6 px-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{t.config.title}</h1>
              <p className="text-slate-400 text-sm">
                {t.config.serviceLabel}: {appName}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {t.config.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap mt-2 md:mt-0 gap-2">
            <Button onClick={refreshAll} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t.config.buttons.reload}
            </Button>
            <Button onClick={handleResetDraft} variant="outline">
              {t.config.buttons.resetDraft}
            </Button>
            <Button onClick={handleSaveDraft} disabled={!canRunConfigActions}>
              <Save className="w-4 h-4 mr-2" />
              {t.config.buttons.saveDraft}
            </Button>
            <Button onClick={handleMergeDraft} disabled={!canRunConfigActions}>
              <GitMerge className="w-4 h-4 mr-2" />
              {t.config.buttons.merge}
            </Button>
          </div>
        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 px-6 flex-1 min-h-0">
        {/* Default */}
        <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800">
            {t.config.sections.defaultConfig}
          </div>
          <div className="flex-1 min-h-0">
            <div className="h-full">
              {hasDefaultConfig ? (
                <Editor
                  height="100%"
                  defaultLanguage="yaml"
                  theme="vs-dark"
                  value={defaultConfig}
                  onMount={(editor) => (defaultEditorRef.current = editor)}
                  options={{ readOnly: true, ...monacoEditorOptions }}
                />
              ) : (
                <div className="h-full flex gap-2 items-center justify-center text-sm text-slate-500">
                  <Loader className="size-4 animate-spin ml-2" />{t.config.loading.defaultConfig}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Draft */}
        <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800">
            {t.config.sections.draftConfig}
          </div>
          <div className="flex-1 min-h-0">
            <div className="h-full">
              {canRenderDraftEditor ? (
                <Editor
                  height="100%"
                  defaultLanguage="yaml"
                  theme="vs-dark"
                  value={editableDraft}
                  onMount={(editor) => (draftEditorRef.current = editor)}
                  onChange={(value) => {
                    setDraftYaml(value ?? "");
                    setHasLocalChange(true);
                  }}
                  options={{ readOnly: false, ...monacoEditorOptions }}
                />
              ) : (
                <div className="h-full flex gap-2 items-center justify-center text-sm text-slate-500">
                  <Loader className="size-4 animate-spin ml-2" />{t.config.loading.draftConfig}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 mt-4">
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800">
            {t.config.sections.diffPreview}
          </div>
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            {t.config.sections.diffHint}
          </div>

          <div className="md:h-50 h-25">
            {canRenderDiffEditor ? (
              <DiffEditor
                height="100%"
                original={currentCustomConfig}
                modified={editorValueForDiff || ""}
                language="yaml"
                theme="vs-dark"
                options={{
                  readOnly: true,
                  automaticLayout: true,
                  minimap: { enabled: false },
                  renderSideBySide: false,
                  renderIndicators: true,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  folding: true,
                  glyphMargin: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center gap-2 justify-center text-sm text-slate-500">
                <Loader className="size-4 animate-spin" />{t.config.loading.diffPreview}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationConfigViewPage;
