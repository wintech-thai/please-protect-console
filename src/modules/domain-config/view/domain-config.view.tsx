"use client";

import { useState, useRef } from "react";
import {
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Globe,
  Tag,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import {
  useAllConfig,
  useSaveField,
  type ConfigField,
} from "../hooks/use-domain-config";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum allowed logo file size: 512 KB */
const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_MAX_LABEL = "512 KB";

// ─── Types ────────────────────────────────────────────────────────────────────

type T = typeof translations.domainConfig.EN;

// ─── Logo URL validator ───────────────────────────────────────────────────────

/**
 * Sends a HEAD request to the given URL (via the Next.js proxy route to avoid
 * CORS issues) and resolves with the Content-Length in bytes.
 *
 * Returns null when the size cannot be determined (server didn't send
 * Content-Length), in which case we allow the save to proceed.
 *
 * Throws with a human-readable message when the image exceeds LOGO_MAX_BYTES.
 */
async function validateLogoUrl(url: string): Promise<void> {
  let contentLength: number | null = null;

  try {
    // Use the backend proxy so we avoid browser CORS restrictions on HEAD.
    // We pass the target URL as a query param to a lightweight Next.js API route.
    // If that route doesn't exist, fall back to a direct browser fetch.
    const proxyUrl = `/api/proxy-head?url=${encodeURIComponent(url)}`;
    let res = await fetch(proxyUrl, { method: "HEAD" });

    // If the proxy route 404s, try a direct HEAD request as a best-effort.
    if (!res.ok && res.status === 404) {
      res = await fetch(url, { method: "HEAD", mode: "cors" });
    }

    if (res.ok) {
      const cl = res.headers.get("content-length");
      if (cl) contentLength = parseInt(cl, 10);
    }
  } catch {
    // Network error or CORS block — skip size check and let the server decide.
    return;
  }

  if (contentLength !== null && contentLength > LOGO_MAX_BYTES) {
    const kb = (contentLength / 1024).toFixed(0);
    throw new Error(`Image is ${kb} KB, maximum allowed size is ${LOGO_MAX_LABEL}.`);
  }
}

// ─── Logo Preview ─────────────────────────────────────────────────────────────

const LogoPreview = ({ url, t }: { url: string; t: T }) => {
  const [errored, setErrored] = useState(false);

  if (!url) return null;

  return (
    <div className="mt-3 flex items-start gap-4">
      <span className="text-base uppercase font-bold text-slate-500 tracking-wide pt-1 shrink-0">
        {t.logoPreview}
      </span>
      <div className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 min-w-24 min-h-24">
        {errored ? (
          <div className="flex flex-col items-center gap-1 text-slate-500 text-xs text-center px-2">
            <ImageIcon className="w-6 h-6 text-slate-600" />
            {t.logoError}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Organisation logo"
            className="max-h-32 max-w-64 object-contain rounded"
            onError={() => setErrored(true)}
            onLoad={() => setErrored(false)}
          />
        )}
      </div>
    </div>
  );
};

// ─── Config Row ───────────────────────────────────────────────────────────────

interface ConfigRowProps {
  field: ConfigField;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  icon: React.ReactNode;
  t: T;
  onSave: (field: ConfigField, value: string) => Promise<void>;
  isSaving: boolean;
}

const ConfigRow = ({
  field,
  label,
  description,
  placeholder,
  value,
  icon,
  t,
  onSave,
  isSaving,
}: ConfigRowProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Debounce timer ref for live logo validation while typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogoField = field === "logo";

  const handleEdit = () => {
    setDraft(value);
    setValidationError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(value);
    setValidationError(null);
    setEditing(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleDraftChange = (next: string) => {
    setDraft(next);
    setValidationError(null);

    if (!isLogoField) return;

    // Debounced live validation while the user types a logo URL
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!next.trim() || next === value) return;

    debounceRef.current = setTimeout(async () => {
      setValidating(true);
      try {
        await validateLogoUrl(next.trim());
        setValidationError(null);
      } catch (err) {
        const e = err as { message?: string };
        setValidationError(e.message ?? t.logoSizeError);
      } finally {
        setValidating(false);
      }
    }, 600);
  };

  const handleSave = async () => {
    // For logo field: run validation once more synchronously before saving
    if (isLogoField && draft.trim() && draft !== value) {
      setValidating(true);
      try {
        await validateLogoUrl(draft.trim());
        setValidationError(null);
      } catch (err) {
        const e = err as { message?: string };
        setValidationError(e.message ?? t.logoSizeError);
        setValidating(false);
        return; // abort save
      } finally {
        setValidating(false);
      }
    }

    await onSave(field, draft);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  const canSave =
    !isSaving &&
    !validating &&
    !validationError &&
    draft.trim() !== "" &&
    draft !== value;

  // Show preview for the current live draft URL (while editing) or saved value
  const previewUrl = isLogoField
    ? editing
      ? draft.trim()
      : value
    : "";

  return (
    <div className="flex flex-col gap-2 py-5 border-b border-slate-800 last:border-b-0">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-base font-semibold text-slate-200">{label}</span>
        <span className="text-sm text-slate-500 hidden sm:block">
          — {description}
        </span>
      </div>

      {/* Input / display row */}
      <div className="flex items-center gap-3 flex-wrap">
        {editing ? (
          <>
            <div className="flex-1 min-w-48 flex flex-col gap-1">
              <div className="relative flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={draft}
                  placeholder={placeholder}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-slate-800 border focus:outline-none text-slate-100 text-sm rounded-lg px-3 h-10 placeholder:text-slate-600 transition-colors pr-8 ${
                    validationError
                      ? "border-red-500/70 focus:border-red-500"
                      : "border-slate-600 focus:border-cyan-500/70"
                  }`}
                />
                {/* Inline validation spinner */}
                {validating && (
                  <Loader2 className="absolute right-2.5 w-3.5 h-3.5 animate-spin text-slate-400" />
                )}
              </div>

              {/* Validation error message */}
              {validationError && (
                <div className="flex items-center gap-1.5 text-red-400 text-sm">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Size hint for logo field */}
              {isLogoField && !validationError && (
                <span className="text-sm text-slate-600">
                  {t.logoSizeHint.replace("{max}", LOGO_MAX_LABEL)}
                </span>
              )}
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors self-start"
            >
              {isSaving || validating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {isSaving ? t.saving : t.save}
            </button>

            {/* Cancel */}
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm font-semibold transition-colors self-start"
            >
              <X className="w-3.5 h-3.5" />
              {t.cancel}
            </button>
          </>
        ) : (
          <>
            <span
              className={`flex-1 text-sm font-mono px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-800 truncate ${
                value ? "text-slate-100" : "text-slate-600 italic"
              }`}
            >
              {value || t.noValue}
            </span>
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t.edit}
            </button>
          </>
        )}
      </div>

      {/* Logo preview */}
      {isLogoField && previewUrl && <LogoPreview url={previewUrl} t={t} />}
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export default function DomainConfigView() {
  const { language } = useLanguage();
  const t =
    translations.domainConfig[
      language as keyof typeof translations.domainConfig
    ] ?? translations.domainConfig.EN;

  const { data, isLoading, isError, refetch, isFetching } = useAllConfig();
  const { mutateAsync, isPending } = useSaveField();

  const handleSave = async (field: ConfigField, value: string) => {
    try {
      await mutateAsync({ field, value });
      toast.success(t.saveSuccess);
    } catch (err) {
      const error = err as { message?: string };
      toast.error(t.saveError, { description: error?.message });
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <span className="text-sm font-medium">{t.loadError}</span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  const domain = data?.domain?.configValue ?? "";
  const logo = data?.logo?.configValue ?? "";
  const shortName = data?.shortName?.configValue ?? "";

  return (
    <div className="w-full h-full bg-slate-950 text-slate-200 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wide">
              {t.title}
            </h1>
            <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
          </div>
          {isFetching && !isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500 mt-1 shrink-0" />
          )}
        </div>

        {/* Config card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 divide-y divide-slate-800">
          <ConfigRow
            field="shortName"
            label={t.shortName}
            description={t.shortNameDesc}
            placeholder={t.shortNamePlaceholder}
            value={shortName}
            icon={<Tag className="w-4 h-4" />}
            t={t}
            onSave={handleSave}
            isSaving={isPending}
          />
          <ConfigRow
            field="domain"
            label={t.domain}
            description={t.domainDesc}
            placeholder={t.domainPlaceholder}
            value={domain}
            icon={<Globe className="w-4 h-4" />}
            t={t}
            onSave={handleSave}
            isSaving={isPending}
          />
          <ConfigRow
            field="logo"
            label={t.logoUrl}
            description={t.logoUrlDesc}
            placeholder={t.logoUrlPlaceholder}
            value={logo}
            icon={<ImageIcon className="w-4 h-4" />}
            t={t}
            onSave={handleSave}
            isSaving={isPending}
          />
        </div>
      </div>
    </div>
  );
}
