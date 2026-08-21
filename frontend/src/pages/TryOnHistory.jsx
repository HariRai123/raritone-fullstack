import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getTryOnHistory } from "../services/tryonService";

function TryOnHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTryOnHistory();

        if (mounted) {
          setResults(data?.results || []);
        }
      } catch (err) {
        console.error(
          "Failed to load try-on history:",
          err,
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load try-on history.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />

            <div className="mt-3 h-9 w-64 animate-pulse rounded-lg bg-neutral-200" />

            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-200" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white"
              >
                <div className="grid sm:grid-cols-[190px_1fr]">

                  <div className="aspect-[3/4] animate-pulse bg-neutral-200 sm:aspect-auto" />

                  <div className="space-y-4 p-5">

                    <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />

                    <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />

                    <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />

                    <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />

                    <div className="h-10 animate-pulse rounded-full bg-neutral-100" />

                  </div>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-red-200 bg-white px-6 py-16 text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <X className="h-6 w-6" />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Try-On History
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Unable to load history
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 inline-flex h-11 items-center rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Try Again
          </button>

        </div>
      </section>
    );
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (results.length === 0) {
    return (
      <section className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Sparkles className="h-4 w-4 text-neutral-500" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Raritone AI Studio
                </span>

              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Try-On History
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Your previous AI try-on sessions and
                analysis results.
              </p>

            </div>

            <Link
              to="/try-on"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <WandSparkles className="h-4 w-4" />
              New Try-On
            </Link>

          </div>

          <div className="mt-10 flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white px-6 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No try-on sessions yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
              Upload a photo, choose a garment and
              start your first Raritone AI try-on.
            </p>

            <Link
              to="/try-on"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <WandSparkles className="h-4 w-4" />
              Start Try-On
            </Link>

          </div>

        </div>
      </section>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <section className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Sparkles className="h-4 w-4 text-neutral-500" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                Raritone AI Studio
              </span>

            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Try-On History
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Review your previous AI try-on sessions,
              selected garments and analysis results.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 sm:block">

              <span className="text-xs text-neutral-400">
                Sessions
              </span>

              <span className="ml-2 text-xs font-semibold text-neutral-900">
                {results.length}
              </span>

            </div>

            <Link
              to="/try-on"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <WandSparkles className="h-4 w-4" />
              New Try-On
            </Link>

          </div>

        </div>

        {/* ===================================================
            HISTORY GRID
        =================================================== */}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">

          {results.map((item) => {

            const product =
              typeof item.productId === "object"
                ? item.productId
                : null;

            const personDetected =
              Boolean(item.personDetected);

            const formattedStatus =
              item.status
                ?.replaceAll("_", " ")
                .toUpperCase() ||
              "PROCESSING";

            const createdDate = item.createdAt
              ? new Date(
                  item.createdAt,
                ).toLocaleString("en-IN")
              : "--";

            return (
              <article
                key={item._id}
                className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >

                <div className="grid sm:grid-cols-[190px_1fr]">

                  {/* =================================================
                      IMAGE
                  ================================================= */}

                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 sm:aspect-auto">

                    {item.inputImageReference ? (
                      <img
                        src={item.inputImageReference}
                        alt="Try-on input"
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full min-h-64 items-center justify-center">

                        <ImageIcon className="h-8 w-8 text-neutral-300" />

                      </div>
                    )}

                    {/* Overlay */}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold text-neutral-900 shadow-sm backdrop-blur">

                        <Sparkles className="h-2.5 w-2.5" />

                        Try-On

                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  <div className="flex flex-col p-5">

                    {/* Status */}

                    <div className="flex items-center justify-between gap-3">

                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-neutral-600">
                        {formattedStatus}
                      </span>

                      <span className="text-[10px] text-neutral-400">
                        #{item._id?.slice(-6)}
                      </span>

                    </div>

                    {/* Product */}

                    <div className="mt-5">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        Selected Garment
                      </p>

                      <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-neutral-950">
                        {product?.name ||
                          "Try-On Session"}
                      </h2>

                      {product && (
                        <div className="mt-1 flex items-center gap-2">

                          {product.brand && (
                            <span className="text-xs text-neutral-500">
                              {product.brand}
                            </span>
                          )}

                          {product.brand && (
                            <span className="text-neutral-300">
                              ·
                            </span>
                          )}

                          <span className="text-xs font-medium text-neutral-700">
                            ₹
                            {Number(
                              product.price || 0,
                            ).toLocaleString(
                              "en-IN",
                            )}
                          </span>

                        </div>
                      )}

                    </div>

                    {/* Analysis */}

                    <div className="mt-5 space-y-2">

                      <div
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          personDetected
                            ? "border-neutral-100 bg-neutral-50"
                            : "border-red-100 bg-red-50"
                        }`}
                      >

                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            personDetected
                              ? "bg-black text-white"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {personDetected ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="text-[11px] font-semibold">
                            Person Detection
                          </p>

                          <p className="truncate text-[10px] text-neutral-400">
                            {personDetected
                              ? "Person detected successfully"
                              : "Person not detected"}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
                          <WandSparkles className="h-3.5 w-3.5 text-neutral-700" />
                        </div>

                        <div className="min-w-0">

                          <p className="text-[11px] font-semibold">
                            AI Model
                          </p>

                          <p className="truncate text-[10px] text-neutral-400">
                            {item.aiModelVersion ||
                              "--"}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* Meta */}

                    <div className="mt-5 grid grid-cols-2 gap-2">

                      <div className="rounded-xl bg-neutral-50 p-3">

                        <div className="flex items-center gap-1.5">

                          <Clock3 className="h-3 w-3 text-neutral-400" />

                          <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                            Processing
                          </span>

                        </div>

                        <p className="mt-1 text-xs font-semibold">
                          {item.processingTime
                            ? `${Number(
                                item.processingTime,
                              ).toFixed(
                                3,
                              )}s`
                            : "--"}
                        </p>

                      </div>

                      <div className="rounded-xl bg-neutral-50 p-3">

                        <div className="flex items-center gap-1.5">

                          <CalendarDays className="h-3 w-3 text-neutral-400" />

                          <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                            Created
                          </span>

                        </div>

                        <p className="mt-1 truncate text-xs font-semibold">
                          {createdDate}
                        </p>

                      </div>

                    </div>

                    {/* Action */}

                    <div className="mt-auto pt-5">

                      <Link
                        to={`/try-on/result?id=${item._id}`}
                        className="group/button flex h-10 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-semibold text-white transition hover:bg-neutral-800"
                      >

                        <p className="text-white">View Analysis</p>

                        <ExternalLink className="h-3.5 w-3.5 transition group-hover/button:translate-x-0.5" />

                      </Link>

                    </div>

                  </div>

                </div>

              </article>
            );
          })}

        </div>

      </div>

    </section>
  );
}

export default TryOnHistory;