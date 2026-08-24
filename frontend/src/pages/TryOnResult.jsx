import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  getTryOnSession,
  retryTryOn,
} from "../services/tryonService";

const ACTIVE_STATES = new Set([
  "pending",
  "processing",
]);

const POLL_INTERVAL = 2000;

// Safety limit.
// We don't want the browser polling forever.
const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes

function StatusPill({ status }) {
  const normalizedStatus = status || "unknown";

  const label = normalizedStatus.replaceAll("_", " ");

  const active = ACTIVE_STATES.has(normalizedStatus);
  const failed = normalizedStatus === "failed";
  const completed = normalizedStatus === "completed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        failed
          ? "bg-red-50 text-red-700"
          : active
            ? "bg-amber-50 text-amber-700"
            : completed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {active ? (
        <Clock3 className="h-3 w-3" />
      ) : failed ? (
        <X className="h-3 w-3" />
      ) : completed ? (
        <Check className="h-3 w-3" />
      ) : (
        <Clock3 className="h-3 w-3" />
      )}

      {label}
    </span>
  );
}

function TryOnResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const id = searchParams.get("id");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);

  const [retrying, setRetrying] = useState(false);

  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  const [polling, setPolling] = useState(false);

  const pollStartTime = useRef(null);

  const pollTimer = useRef(null);

  const isMounted = useRef(true);

  /*
  |--------------------------------------------------------------------------
  | COMPONENT CLEANUP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      isMounted.current = false;

      if (pollTimer.current) {
        window.clearTimeout(pollTimer.current);
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD SESSION
  |--------------------------------------------------------------------------
  */

  const loadResult = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!id) {
        if (isMounted.current) {
          setError("No try-on session was provided.");
          setLoading(false);
        }

        return null;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const data = await getTryOnSession(id);

        if (!data?.result) {
          throw new Error(
            "Try-on session was not returned by the server.",
          );
        }

        if (isMounted.current) {
          setResult(data.result);
          setError("");
        }

        return data.result;
      } catch (err) {
        console.error(
          "GET TRY-ON SESSION ERROR:",
          err,
        );

        if (isMounted.current) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unable to load try-on result.",
          );
        }

        return null;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL SESSION LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadResult({
      showLoader: true,
    });
  }, [loadResult]);

  /*
  |--------------------------------------------------------------------------
  | REAL BACKEND STATUS POLLING
  |--------------------------------------------------------------------------
  |
  | The frontend does NOT fake progress.
  |
  | Backend:
  |
  | pending
  |    ↓
  | processing
  |    ↓
  | completed
  |
  | OR
  |
  | processing
  |    ↓
  | failed
  |
  */

  useEffect(() => {
    if (!result) {
      return undefined;
    }

    if (!ACTIVE_STATES.has(result.status)) {
      setPolling(false);

      return undefined;
    }

    if (!pollStartTime.current) {
      pollStartTime.current = Date.now();
    }

    setPolling(true);

    const poll = async () => {
      const elapsed =
        Date.now() - pollStartTime.current;

      /*
       * Prevent infinite polling.
       */

      if (elapsed >= MAX_POLL_TIME) {
        if (isMounted.current) {
          setPolling(false);

          setError(
            "Try-on processing is taking longer than expected. Please retry the session.",
          );
        }

        return;
      }

      const nextResult = await loadResult();

      if (!nextResult) {
        /*
         * Network failure should not immediately
         * destroy the session.
         *
         * Try again after the normal polling interval.
         */

        pollTimer.current = window.setTimeout(
          poll,
          POLL_INTERVAL,
        );

        return;
      }

      /*
       * AI finished.
       */

      if (
        !ACTIVE_STATES.has(
          nextResult.status,
        )
      ) {
        if (isMounted.current) {
          setPolling(false);
        }

        return;
      }

      /*
       * AI is still processing.
       */

      pollTimer.current = window.setTimeout(
        poll,
        POLL_INTERVAL,
      );
    };

    pollTimer.current = window.setTimeout(
      poll,
      POLL_INTERVAL,
    );

    return () => {
      if (pollTimer.current) {
        window.clearTimeout(
          pollTimer.current,
        );
      }
    };
  }, [result?.status, loadResult]);

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = async () => {
    if (!id || retrying) {
      return;
    }

    try {
      setRetrying(true);
      setError("");

      pollStartTime.current =
        Date.now();

      const response =
        await retryTryOn(id);

      /*
       * Some backend implementations
       * return the updated session.
       */

      if (response?.result) {
        setResult(response.result);
      } else if (response?.tryOn) {
        setResult(response.tryOn);
      } else {
        /*
         * Otherwise fetch the latest
         * session from MongoDB.
         */

        await loadResult();
      }
    } catch (err) {
      console.error(
        "TRY-ON RETRY ERROR:",
        err,
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to retry this try-on.",
      );
    } finally {
      if (isMounted.current) {
        setRetrying(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SHARE
  |--------------------------------------------------------------------------
  */

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            "Raritone Try-On Result",
          text:
            "Check out my Raritone virtual try-on.",
          url: window.location.href,
        });

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        setCopied(true);

        window.setTimeout(() => {
          if (isMounted.current) {
            setCopied(false);
          }
        }, 1800);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(
          "Share failed:",
          err,
        );
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addToCart(product);
  };

  /*
  |--------------------------------------------------------------------------
  | NO SESSION
  |--------------------------------------------------------------------------
  */

  if (!id) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-14">

          <X className="mx-auto h-8 w-8 text-red-600" />

          <h1 className="mt-5 text-2xl font-semibold">
            Try-On session not found
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
            We couldn't find a valid Try-On session.
          </p>

          <Link
            to="/try-on"
            className="mt-7 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Start Try-On
          </Link>

        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  if (loading && !result) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-14">

          {error ? (
            <X className="mx-auto h-8 w-8 text-red-600" />
          ) : (
            <Sparkles className="mx-auto h-8 w-8 animate-pulse" />
          )}

          <h1 className="mt-5 text-2xl font-semibold">
            {error ||
              "Loading your try-on session…"}
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
            {error
              ? "The session could not be loaded."
              : "Retrieving the latest backend status."}
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
                onClick={() =>
                  loadResult({
                    showLoader: true,
                  })
                }
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

  /*
  |--------------------------------------------------------------------------
  | PRODUCT
  |--------------------------------------------------------------------------
  */

  const product =
    typeof result?.productId ===
    "object"
      ? result.productId
      : result?.product;

  /*
  |--------------------------------------------------------------------------
  | SESSION STATES
  |--------------------------------------------------------------------------
  */

  const status =
    result?.status || "unknown";

  const isActive =
    ACTIVE_STATES.has(status);

  const completed =
    status === "completed";

  const failed =
    status === "failed";

  /*
  |--------------------------------------------------------------------------
  | MEASUREMENTS
  |--------------------------------------------------------------------------
  */

  const measurements =
    result?.bodyMeasurements || {};

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <section className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

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

          <StatusPill
            status={status}
          />

        </div>

        {/* =====================================================
            BACKEND STATUS
        ====================================================== */}

        {isActive && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">

            <Sparkles className="mt-0.5 h-5 w-5 animate-pulse" />

            <div className="min-w-0">

              <strong className="text-sm">
                {status === "pending"
                  ? "Try-On session created"
                  : "AI processing in progress"}
              </strong>

              <p className="mt-1 text-sm text-amber-800">
                Backend status:{" "}
                <b className="capitalize">
                  {status}
                </b>
              </p>

              {result.message && (
                <p className="mt-1 text-xs text-amber-700">
                  {result.message}
                </p>
              )}

              <p className="mt-2 text-xs text-amber-700">
                This page automatically checks
                the backend for updates.
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-amber-100">

                <div className="h-full w-1/3 animate-pulse rounded-full bg-amber-500" />

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && !isActive && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <X className="mt-0.5 h-4 w-4 shrink-0" />

            <div>

              <p className="font-medium">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            FAILED
        ====================================================== */}

        {failed && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <strong className="text-sm text-red-900">
                Try-on processing failed
              </strong>

              <p className="mt-1 text-sm text-red-700">
                {result.errorMessage ||
                  result.message ||
                  "The AI service could not process this session."}
              </p>

            </div>

            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RefreshCw
                className={`h-4 w-4 ${
                  retrying
                    ? "animate-spin"
                    : ""
                }`}
              />

              {retrying
                ? "Retrying…"
                : "Retry Try-On"}

            </button>

          </div>
        )}

        {/* =====================================================
            BEFORE / AFTER
        ====================================================== */}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">

          {/* BEFORE */}

          <ResultImageCard
            label="BEFORE"
            title="Original Photo"
            src={result.inputImageReference}
            fallback="Original photo is not available."
          />

          {/* AFTER */}

          <ResultImageCard
            label="AFTER"
            title="AI Try-On Output"
            src={result.resultImageReference}
            fallback={
              completed
                ? "Final garment image is not available from the current AI service."
                : "The generated result will appear here when processing completes."
            }
          />

        </div>

        {/* =====================================================
            PRODUCT
        ====================================================== */}

        {product && (
          <div className="mt-5 flex flex-col gap-5 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 gap-4">

              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-20 w-16 rounded-xl object-cover"
                />
              )}

              <div className="min-w-0">

                <p className="text-xs text-neutral-400">
                  Selected garment
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  {product.name}
                </h2>

                <p className="text-sm text-neutral-500">
                  {product.brand ||
                    "Raritone"}
                  {" · "}
                  ₹
                  {Number(
                    product.price || 0,
                  ).toLocaleString(
                    "en-IN",
                  )}
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!completed}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >

                <ShoppingBag className="h-4 w-4" />

                Add to Cart

              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/products/${product._id}`,
                  )
                }
                className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-50"
              >
                View Product
              </button>

            </div>

          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {completed && (
          <div className="mt-5 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">

            <div className="flex items-center gap-2 font-semibold text-emerald-900">

              <Check className="h-5 w-5" />

              Try-On processing completed

            </div>

            <p className="mt-1 text-sm text-emerald-800">

              {result.message ||
                "Your AI Try-On session has completed successfully."}

            </p>

          </div>
        )}

        {/* =====================================================
            BODY ANALYSIS
        ====================================================== */}

        {result.personDetected && (
          <div className="mt-5 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-2">

              <Sparkles className="h-4 w-4" />

              <h2 className="font-semibold">
                Body Analysis
              </h2>

            </div>

            <p className="mt-1 text-xs text-neutral-500">
              Relative AI ratios, not physical
              measurements in centimeters.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              {[
                [
                  "Shoulder Width",
                  "shoulder_width_ratio",
                ],
                [
                  "Hip Width",
                  "hip_width_ratio",
                ],
                [
                  "Left Arm",
                  "left_arm_ratio",
                ],
                [
                  "Right Arm",
                  "right_arm_ratio",
                ],
                [
                  "Left Leg",
                  "left_leg_ratio",
                ],
                [
                  "Right Leg",
                  "right_leg_ratio",
                ],
                [
                  "Torso",
                  "torso_ratio",
                ],
                [
                  "Shoulder / Hip",
                  "shoulder_to_hip_ratio",
                ],
              ].map(
                ([label, key]) => (
                  <div
                    key={key}
                    className="rounded-2xl bg-neutral-50 p-4"
                  >

                    <span className="text-xs text-neutral-400">
                      {label}
                    </span>

                    <strong className="mt-1 block text-lg">
                      {measurements[key] ??
                        "--"}
                    </strong>

                  </div>
                ),
              )}

            </div>

          </div>
        )}

        {/* =====================================================
            SESSION DETAILS
        ====================================================== */}

        <div className="mt-5 grid gap-3 sm:grid-cols-4">

          <InfoCard
            label="Status"
            value={status}
          />

          <InfoCard
            label="AI Model"
            value={
              result.aiModelVersion ||
              "--"
            }
          />

          <InfoCard
            label="Processing"
            value={
              typeof result.processingTime ===
              "number"
                ? `${result.processingTime.toFixed(
                    2,
                  )}s`
                : "--"
            }
          />

          <InfoCard
            label="Created"
            value={
              result.createdAt
                ? new Date(
                    result.createdAt,
                  ).toLocaleString(
                    "en-IN",
                  )
                : "--"
            }
          />

        </div>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="mt-7 flex flex-wrap gap-3 pb-10">

          <Link
            to="/try-on"
            className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Try Another
          </Link>

          <Link
            to="/try-on/history"
            className="rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-50"
          >
            View History
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-neutral-50"
          >

            <Share2 className="h-4 w-4" />

            {copied
              ? "Copied"
              : "Share"}

          </button>

        </div>

      </div>

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| RESULT IMAGE CARD
|--------------------------------------------------------------------------
*/

function ResultImageCard({
  label,
  title,
  src,
  fallback,
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {label}
          </p>

          <h2 className="mt-1 font-semibold">
            {title}
          </h2>

        </div>

        <ImageIcon className="h-5 w-5 text-neutral-300" />

      </div>

      <div className="aspect-[4/5] bg-neutral-100">

        {src ? (
          <img
            src={src}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-neutral-400">

            <Sparkles className="h-8 w-8" />

            <p className="mt-3 text-sm">
              {fallback}
            </p>

          </div>
        )}

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO CARD
|--------------------------------------------------------------------------
*/

function InfoCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">

      <span className="text-xs text-neutral-400">
        {label}
      </span>

      <strong className="mt-1 block text-sm capitalize">
        {value}
      </strong>

    </div>
  );
}

export default TryOnResult;