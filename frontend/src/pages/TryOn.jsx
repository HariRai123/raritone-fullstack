import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import ImageUploader from "../components/ImageUploader";
import GarmentSelector from "../components/GarmentSelector";
import { useAuth } from "../context/AuthContext";
import { createTryOn } from "../services/tryonService";

function TryOn() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/try-on",
        },
        replace: true,
      });
    }
  }, [isAuthenticated, navigate]);

  /*
   * ---------------------------------------------------------
   * CLEANUP PREVIEW URL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /*
   * ---------------------------------------------------------
   * IMAGE SELECTED
   * ---------------------------------------------------------
   */

  const handleImageSelected = (file) => {
    if (!file) {
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));

    // A new image means the previous session is no longer relevant.
    setSession(null);
    setError("");
  };

  /*
   * ---------------------------------------------------------
   * REMOVE / RETAKE PHOTO
   * ---------------------------------------------------------
   */

  const removeImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
    setSession(null);
    setSelectedProduct(null);
    setError("");
  };

  /*
   * ---------------------------------------------------------
   * CREATE TRY-ON SESSION
   * ---------------------------------------------------------
   */

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please upload a photo first.");
      return;
    }

    if (!selectedProduct) {
      setError("Please select a garment before processing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await createTryOn({
        image,
        productId: selectedProduct._id,
      });

      console.log("TRY-ON SESSION RESPONSE:", response);

      const createdSession = response?.tryOn;

      if (!createdSession) {
        throw new Error(
          "Try-on session was not returned by the server.",
        );
      }

      setSession(createdSession);

      /*
       * Backend returns the session ID as `id`.
       *
       * TryOnResult currently reads:
       *
       * /try-on/result?id=SESSION_ID
       */

      if (createdSession.id) {
        navigate(`/try-on/result?id=${createdSession.id}`);
        return;
      }

      if (createdSession._id) {
        navigate(`/try-on/result?id=${createdSession._id}`);
        return;
      }

      throw new Error(
        "Try-on session ID was not returned by the server.",
      );
    } catch (err) {
      console.error("Try-on workflow error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to start the try-on session.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * AUTH GUARD
   * ---------------------------------------------------------
   */

  if (!isAuthenticated) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-neutral-50">
      {/* =====================================================
          HERO
      ====================================================== */}

      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
                  Raritone AI Studio
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                Try it before
                <span className="block text-neutral-400">
                  you buy it.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-500 sm:text-base">
                Upload your photo, choose a garment from the Raritone
                collection, and let our AI-powered try-on experience
                prepare your look.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/try-on/history"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                History
              </Link>

              <Link
                to="/products"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <span>Browse Products</span>

                <ArrowRight className="h-4 w-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <X className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <p className="text-sm font-medium">
                Try-on couldn't start
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          WORKSPACE
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* =================================================
              LEFT — PHOTO
          ================================================== */}

          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            {!preview ? (
              <div className="p-5 sm:p-7">
                <div className="mb-6">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <ImageIcon className="h-4 w-4" />
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Step 01
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Add your photo
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Use a clear full-body photo for the best AI
                    analysis.
                  </p>
                </div>

                <ImageUploader
                  onImageSelected={handleImageSelected}
                  disabled={loading}
                />

                <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
                      <Camera className="h-3.5 w-3.5 text-neutral-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-neutral-800">
                        Photo tips
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Stand facing the camera, keep your full body
                        visible, use good lighting, and avoid heavy
                        obstructions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-7">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      Step 01
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Your photo
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={loading}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retake
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
                  <img
                    src={preview}
                    alt="Uploaded person"
                    className="max-h-[650px] w-full object-contain"
                  />

                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                    <Check className="h-3 w-3" />
                    Photo ready
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {image?.name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {image
                        ? `${(image.size / 1024 / 1024).toFixed(
                            2,
                          )} MB`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={loading}
                    className="shrink-0 text-xs font-medium text-neutral-500 hover:text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT — GARMENT
          ================================================== */}

          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            {!preview ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                  <Sparkles className="h-6 w-6 text-neutral-400" />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Choose your garment
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Upload your photo first. Your selected garments
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="p-5 sm:p-7">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Step 02
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Select a garment
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Choose something from the Raritone collection.
                  </p>
                </div>

                {loading ? (
                  <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl bg-neutral-50 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                      <Sparkles className="h-6 w-6 animate-pulse text-neutral-500" />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      Creating Try-On Session
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                      Your request is being submitted. Please wait...
                    </p>
                  </div>
                ) : (
                  <>
                    <GarmentSelector
                      selectedProduct={selectedProduct}
                      onSelect={setSelectedProduct}
                    />

                    {/* SELECTED PRODUCT */}

                    {selectedProduct && (
                      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex gap-4">
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            className="h-20 w-16 rounded-xl object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                              Selected garment
                            </p>

                            <h3 className="mt-1 truncate text-sm font-semibold">
                              {selectedProduct.name}
                            </h3>

                            {selectedProduct.brand && (
                              <p className="mt-1 text-xs text-neutral-400">
                                {selectedProduct.brand}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-neutral-500">
                              ₹
                              {Number(
                                selectedProduct.price || 0,
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProduct(null)
                            }
                            disabled={loading}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white disabled:opacity-50"
                            aria-label="Remove selected garment"
                          >
                            <X className="h-4 w-4 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TRY ON ACTION */}

                    <button
                      type="button"
                      disabled={
                        !selectedProduct ||
                        !image ||
                        loading
                      }
                      onClick={handleAnalyze}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                    >
                      <Sparkles className="h-4 w-4" />

                      {selectedProduct
                        ? `Try On ${selectedProduct.name}`
                        : "Select a Garment to Continue"}
                    </button>

                    <p className="mt-3 text-center text-[11px] leading-5 text-neutral-400">
                      Your photo will be securely sent through the
                      Raritone backend for processing.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <div className="mt-10 border-t border-neutral-200 pt-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <TryOnStep
              number="01"
              icon={Upload}
              title="Upload"
              description="Add a clear photo of yourself."
            />

            <TryOnStep
              number="02"
              icon={Sparkles}
              title="AI Analysis"
              description="Your try-on request is sent to the backend."
            />

            <TryOnStep
              number="03"
              icon={Camera}
              title="Try On"
              description="Review your try-on result when processing is complete."
            />
          </div>
        </div>

        {/* =====================================================
            SESSION CREATED
        ====================================================== */}

        {session && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />

              <span>
                Try-on session created successfully.
              </span>
            </div>

            {session.status && (
              <p className="mt-1 text-xs text-green-600">
                Session status:{" "}
                {String(session.status)
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TryOnStep({
  number,
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {number}
        </p>

        <h3 className="mt-1 text-sm font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default TryOn;