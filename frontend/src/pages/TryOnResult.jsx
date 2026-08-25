import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Image as ImageIcon,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { getTryOnSession, retryTryOn } from "../services/tryonService";

const ACTIVE_STATES = new Set(["pending", "processing"]);

function StatusPill({ status }) {
  const label = status?.replaceAll("_", " ") || "unknown";
  const active = ACTIVE_STATES.has(status);
  const failed = status === "failed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        failed
          ? "bg-red-50 text-red-700"
          : active
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {active ? (
        <Clock3 className="h-3 w-3" />
      ) : failed ? (
        <X className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

function formatStatus(status) {
  return String(status || "unknown").replaceAll("_", " ");
}

function TryOnResult() {
  const { sessionId: routeSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Supports both the new /try-on/result/:sessionId route and the old ?id= route.
  const id = routeSessionId || searchParams.get("id");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadResult = useCallback(async () => {
    if (!id) {
      setError("No try-on session was provided.");
      setLoading(false);
      return null;
    }

    try {
      const data = await getTryOnSession(id);

      if (!data?.result) {
        throw new Error("Try-on session was not returned by the server.");
      }

      setResult(data.result);
      setError("");
      return data.result;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load try-on result.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch the initial state from the external API.
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      const next = await loadResult();
      if (cancelled) return;
    };

    void fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [loadResult]);

  // Poll only while the backend says the session is pending/processing.
  useEffect(() => {
    if (!id || !result || !ACTIVE_STATES.has(result.status)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadResult();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [id, result?.status, loadResult]);

  const handleRetry = async () => {
    if (!id || retrying) return;

    try {
      setRetrying(true);
      setError("");
      await retryTryOn(id);
      setResult((current) =>
        current
          ? {
              ...current,
              status: "pending",
              resultImageReference: null,
              errorMessage: "",
              message: "Retry queued. Waiting for AI processing.",
            }
          : current,
      );
      await loadResult();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to retry this try-on.",
      );
    } finally {
      setRetrying(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Raritone Try-On Result",
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const product = useMemo(() => {
    if (!result) return null;
    return typeof result.productId === "object"
      ? result.productId
      : result.product || null;
  }, [result]);

  if (loading || !result) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-14">
          {error ? (
            <X className="mx-auto h-8 w-8 text-red-600" />
          ) : (
            <Sparkles className="mx-auto h-8 w-8 animate-pulse" />
          )}

          <h1 className="mt-5 text-2xl font-semibold">
            {error || "Loading your try-on session…"}
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
            {error
              ? "The session could not be loaded."
              : "We are retrieving the latest backend status. Please keep this page open."}
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <Link
              to="/try-on"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Try-On
            </Link>
            {error && (
              <button
                type="button"
                onClick={() => void loadResult()}
                className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const measurements = result.bodyMeasurements || {};
  const completed = result.status === "completed";
  const failed = result.status === "failed";

  const measurementItems = [
    ["Shoulder Width", "shoulder_width_ratio"],
    ["Hip Width", "hip_width_ratio"],
    ["Left Arm", "left_arm_ratio"],
    ["Right Arm", "right_arm_ratio"],
    ["Left Leg", "left_leg_ratio"],
    ["Right Leg", "right_leg_ratio"],
    ["Torso", "torso_ratio"],
    ["Shoulder / Hip", "shoulder_to_hip_ratio"],
  ];

  return (
    <section className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/try-on/history"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Try-On History
            </Link>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              Raritone AI Studio
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your Try-On Result
            </h1>
          </div>
          <StatusPill status={result.status} />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {ACTIVE_STATES.has(result.status) && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <Sparkles className="mt-0.5 h-5 w-5 animate-pulse" />
            <div>
              <strong className="text-sm">AI processing in progress</strong>
              <p className="mt-1 text-sm text-amber-800">
                Backend status: <b>{result.status}</b>. This page automatically
                checks for completion.
              </p>
            </div>
          </div>
        )}

        {failed && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong className="text-sm text-red-900">
                Try-on processing failed
              </strong>
              <p className="mt-1 text-sm text-red-700">
                {result.errorMessage || result.message || "Please retry the session."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying…" : "Retry Try-On"}
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {[
            {
              label: "BEFORE",
              title: "Original Photo",
              src: result.inputImageReference,
            },
            {
              label: "AFTER",
              title: "AI Try-On Output",
              src: result.resultImageReference,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    {card.label}
                  </p>
                  <h2 className="mt-1 font-semibold">{card.title}</h2>
                </div>
                <ImageIcon className="h-5 w-5 text-neutral-300" />
              </div>

              <div className="aspect-[4/5] bg-neutral-100">
                {card.src ? (
                  <img
                    src={card.src}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-neutral-400">
                    <Sparkles className="h-8 w-8" />
                    <p className="mt-3 text-sm">
                      {completed
                        ? "Final garment image is not available from the current AI service."
                        : "Output will appear when processing completes."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {product && (
          <div className="mt-5 flex flex-col gap-4 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-16 w-14 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="text-xs text-neutral-400">Selected garment</p>
                <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
                <p className="text-sm text-neutral-500">
                  {product.brand || "Raritone"} · ₹
                  {Number(product.price || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => navigate(`/products/${product._id}`)}
                className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold"
              >
                View Product
              </button>
            </div>
          </div>
        )}

        {completed && result.personDetected && (
          <div className="mt-5 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-emerald-900">
              <Check className="h-5 w-5" />
              Analysis completed successfully
            </div>
            <p className="mt-1 text-sm text-emerald-800">
              The try-on session has been processed and saved.
            </p>
          </div>
        )}

        <div className="mt-5 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <h2 className="font-semibold">Body Proportions</h2>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Relative AI ratios, not physical measurements in centimeters.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {measurementItems.map(([label, key]) => (
              <div key={key} className="rounded-2xl bg-neutral-50 p-4">
                <span className="text-xs text-neutral-400">{label}</span>
                <strong className="mt-1 block text-lg">
                  {measurements[key] ?? "--"}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="text-xs text-neutral-400">Status</span>
            <strong className="mt-1 block text-sm capitalize">
              {formatStatus(result.status)}
            </strong>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="text-xs text-neutral-400">AI Model</span>
            <strong className="mt-1 block text-sm">
              {result.aiModelVersion || "--"}
            </strong>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="text-xs text-neutral-400">Processing</span>
            <strong className="mt-1 block text-sm">
              {typeof result.processingTime === "number"
                ? `${result.processingTime.toFixed(2)}s`
                : "--"}
            </strong>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="text-xs text-neutral-400">Created</span>
            <strong className="mt-1 block text-sm">
              {result.createdAt
                ? new Date(result.createdAt).toLocaleString("en-IN")
                : "--"}
            </strong>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3 pb-10">
          <Link
            to="/try-on"
            className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Try Another
          </Link>
          <Link
            to="/try-on/history"
            className="rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold"
          >
            View History
          </Link>
          {completed && result.resultImageReference && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              Saved Automatically
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold"
          >
            <Share2 className="h-4 w-4" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default TryOnResult;
