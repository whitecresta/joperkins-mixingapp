import React, { useState, useRef, useEffect } from "react";

// Simplified icons (since lucide-react might not be available)
const PaletteIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const DropletIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ImageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const ColorMixerApp = () => {
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [colorName, setColorName] = useState("Coral Red");
  const [paintParts, setPaintParts] = useState({
    cyan: 0,
    magenta: 0,
    yellow: 0,
    black: 0,
    white: 0,
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isPickingFromImage, setIsPickingFromImage] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize paint parts on component mount
  useEffect(() => {
    updatePaintParts(selectedColor);
  }, []);

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Convert RGB to paint mixing ratios (simplified for artists)
  const rgbToPaintParts = (r, g, b) => {
    // Normalize RGB values
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // Calculate basic CMYK
    const kValue = 1 - Math.max(rNorm, gNorm, bNorm);
    let cValue, mValue, yValue;

    if (kValue < 1) {
      cValue = (1 - rNorm - kValue) / (1 - kValue);
      mValue = (1 - gNorm - kValue) / (1 - kValue);
      yValue = (1 - bNorm - kValue) / (1 - kValue);
    } else {
      cValue = 0;
      mValue = 0;
      yValue = 0;
    }

    // Calculate lightness for white paint
    const lightness =
      (Math.max(rNorm, gNorm, bNorm) + Math.min(rNorm, gNorm, bNorm)) / 2;
    const saturation =
      Math.max(rNorm, gNorm, bNorm) - Math.min(rNorm, gNorm, bNorm);

    // Convert to percentages
    const c = Math.round(cValue * 100);
    const m = Math.round(mValue * 100);
    const y = Math.round(yValue * 100);
    const k = Math.round(kValue * 100);

    // Calculate white based on lightness and saturation
    let white = 0;
    if (lightness > 0.5 && saturation < 0.8) {
      white = Math.round((lightness - 0.5) * 200);
    }

    // Create initial parts object
    const parts = { c, m, y, k, white };

    // Handle pure white case
    if (c === 0 && m === 0 && y === 0 && k === 0) {
      return { cyan: 0, magenta: 0, yellow: 0, black: 0, white: 10 };
    }

    // Handle pure black case
    if (k === 100) {
      return { cyan: 0, magenta: 0, yellow: 0, black: 10, white: 0 };
    }

    // Convert percentages to parts (0-10 scale)
    let rawParts = {
      cyan: Math.round(c / 10) || 0,
      magenta: Math.round(m / 10) || 0,
      yellow: Math.round(y / 10) || 0,
      black: Math.round(k / 10) || 0,
      white: Math.round(white / 10) || 0,
    };

    // Special handling for black - it's very powerful in real mixing
    if (rawParts.black > 0) {
      if (k > 80) {
        rawParts.black = Math.min(10, Math.round(k / 15));
      } else if (k > 50) {
        rawParts.black = Math.min(5, Math.round(k / 20));
      } else if (k > 20) {
        rawParts.black = Math.min(3, Math.round(k / 25));
      } else if (k > 5) {
        rawParts.black = 1;
      } else {
        rawParts.black = 0;
      }
    }

    // Find all non-zero values
    const nonZeroValues = Object.values(rawParts).filter((v) => v > 0);

    // If all values are too small, scale them up
    if (nonZeroValues.length > 0 && Math.max(...nonZeroValues) < 2) {
      Object.keys(rawParts).forEach((key) => {
        const shortKey =
          key === "cyan"
            ? "c"
            : key === "magenta"
            ? "m"
            : key === "yellow"
            ? "y"
            : key === "black"
            ? "k"
            : "white";
        if (parts[shortKey] > 5) {
          rawParts[key] = Math.max(1, Math.round(parts[shortKey] / 15));
        }
      });
    }

    // Ensure significant colors get at least 1 part
    Object.keys(rawParts).forEach((key) => {
      const shortKey =
        key === "cyan"
          ? "c"
          : key === "magenta"
          ? "m"
          : key === "yellow"
          ? "y"
          : key === "black"
          ? "k"
          : "white";
      if (parts[shortKey] > 15 && rawParts[key] === 0) {
        rawParts[key] = 1;
      }
    });

    // Cap at 10 parts maximum
    Object.keys(rawParts).forEach((key) => {
      if (rawParts[key] > 10) rawParts[key] = 10;
    });

    // If we still have all zeros or very low values, create a more balanced mix
    const totalParts = Object.values(rawParts).reduce(
      (sum, val) => sum + val,
      0
    );
    if (totalParts < 2) {
      const maxPercent = Math.max(c, m, y, k, white);
      if (maxPercent > 0) {
        Object.keys(rawParts).forEach((key) => {
          const shortKey =
            key === "cyan"
              ? "c"
              : key === "magenta"
              ? "m"
              : key === "yellow"
              ? "y"
              : key === "black"
              ? "k"
              : "white";
          if (parts[shortKey] > 0) {
            if (key === "black") {
              rawParts[key] = Math.min(
                2,
                Math.round((parts[shortKey] / maxPercent) * 2)
              );
            } else {
              rawParts[key] = Math.max(
                1,
                Math.round((parts[shortKey] / maxPercent) * 5)
              );
            }
          }
        });
      }
    }

    return rawParts;
  };

  // Handle color change
  const handleColorChange = (e) => {
    const hex = e.target.value;
    setSelectedColor(hex);
    updatePaintParts(hex);
  };

  // Update paint parts based on color
  const updatePaintParts = (hex) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const parts = rgbToPaintParts(rgb.r, rgb.g, rgb.b);
      setPaintParts(parts);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setIsPickingFromImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw image on canvas when uploaded
  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      };

      img.src = uploadedImage;
    }
  }, [uploadedImage]);

  // Handle color picking from image
  const handleImageClick = (e) => {
    if (!canvasRef.current || !isPickingFromImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];

    const hex =
      "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    setSelectedColor(hex);
    updatePaintParts(hex);
  };

  // Predefined colors for quick selection
  const presetColors = [
    { name: "Sky Blue", hex: "#87CEEB", description: "Light, airy blue" },
    { name: "Forest Green", hex: "#228B22", description: "Deep natural green" },
    {
      name: "Sunset Orange",
      hex: "#FF6347",
      description: "Warm, vibrant orange",
    },
    { name: "Royal Purple", hex: "#6B3AA0", description: "Rich, deep purple" },
    {
      name: "Sunshine Yellow",
      hex: "#FFD700",
      description: "Bright, cheerful yellow",
    },
    { name: "Rose Pink", hex: "#FF1493", description: "Bold, romantic pink" },
    {
      name: "Chocolate Brown",
      hex: "#7B3F00",
      description: "Rich, earthy brown",
    },
    {
      name: "Charcoal Gray",
      hex: "#36454F",
      description: "Deep, sophisticated gray",
    },
  ];

  const selectPresetColor = (preset) => {
    setSelectedColor(preset.hex);
    setColorName(preset.name);
    updatePaintParts(preset.hex);
  };

  // Generate mixing instructions
  const getMixingInstructions = () => {
    const { cyan, magenta, yellow, black, white } = paintParts;
    const parts = [];

    if (cyan > 0) parts.push(`${cyan} ${cyan === 1 ? "part" : "parts"} Cyan`);
    if (magenta > 0)
      parts.push(`${magenta} ${magenta === 1 ? "part" : "parts"} Magenta`);
    if (yellow > 0)
      parts.push(`${yellow} ${yellow === 1 ? "part" : "parts"} Yellow`);
    if (black > 0)
      parts.push(`${black} ${black === 1 ? "part" : "parts"} Black`);
    if (white > 0)
      parts.push(`${white} ${white === 1 ? "part" : "parts"} White`);

    if (parts.length === 0) return "Pure white";
    return parts.join(" + ");
  };

  // Visual representation of parts
  const renderPartsVisual = (value, maxParts = 10) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[...Array(maxParts)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "2px",
              backgroundColor: "inherit",
              opacity: i < value ? 1 : 0.2,
            }}
          />
        ))}
      </div>
    );
  };

  // Calculate total parts for ratio bar
  const totalParts =
    paintParts.cyan +
    paintParts.magenta +
    paintParts.yellow +
    paintParts.black +
    paintParts.white;

  // Inline styles
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      padding: "16px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    mainCard: {
      maxWidth: "1024px",
      margin: "0 auto",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      padding: "32px",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "32px",
    },
    title: {
      fontSize: "30px",
      fontWeight: "bold",
      color: "#1f2937",
      margin: 0,
    },
    gridTwo: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "32px",
      marginBottom: "32px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    colorPickerContainer: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    colorInput: {
      width: "96px",
      height: "96px",
      border: "2px solid #d1d5db",
      borderRadius: "8px",
      cursor: "pointer",
    },
    textInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "16px",
      outline: "none",
    },
    hexDisplay: {
      fontSize: "14px",
      color: "#6b7280",
      margin: "4px 0",
    },
    uploadButton: {
      marginTop: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 12px",
      backgroundColor: "#e0e7ff",
      color: "#3730a3",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
    },
    colorPreview: {
      width: "100%",
      height: "96px",
      borderRadius: "8px",
      border: "2px solid #e5e7eb",
      boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "12px",
    },
    presetGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "32px",
    },
    presetButton: {
      padding: "12px",
      borderRadius: "8px",
      border: "2px solid #e5e7eb",
      backgroundColor: "white",
      cursor: "pointer",
      textAlign: "left",
      transition: "border-color 0.2s",
    },
    presetColor: {
      width: "100%",
      height: "48px",
      borderRadius: "6px",
      marginBottom: "8px",
    },
    presetName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      margin: "0 0 4px 0",
    },
    presetDesc: {
      fontSize: "12px",
      color: "#6b7280",
      margin: 0,
    },
    mixingSection: {
      background: "linear-gradient(135deg, #eef2ff 0%, #f3e8ff 100%)",
      borderRadius: "12px",
      padding: "24px",
    },
    mixingHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "16px",
    },
    mixingTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1f2937",
      margin: 0,
    },
    recipeCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "16px",
    },
    recipeName: {
      fontSize: "18px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    recipeInstructions: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#000000",
      marginBottom: "16px",
    },
    visualRatioLabel: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "8px",
    },
    paintBlobsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      padding: "16px",
      backgroundColor: "#f9fafb",
      borderRadius: "8px",
      border: "2px solid #e5e7eb",
    },
    paintBlob: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: "2px solid white",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: "bold",
    },
    partsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "12px",
    },
    partCard: {
      textAlign: "center",
    },
    partDisplay: {
      borderRadius: "8px",
      padding: "16px 8px",
      marginBottom: "8px",
    },
    partNumber: {
      fontSize: "30px",
      fontWeight: "bold",
      margin: "0 0 8px 0",
    },
    partColorName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      margin: "0",
    },
    partPaintName: {
      fontSize: "12px",
      color: "#6b7280",
      margin: "0",
    },
    infoSection: {
      marginTop: "24px",
      backgroundColor: "#dbeafe",
      borderRadius: "8px",
      padding: "16px",
      display: "flex",
      gap: "12px",
    },
    infoText: {
      fontSize: "14px",
      color: "#1e3a8a",
    },
    imageSection: {
      marginBottom: "32px",
    },
    imageHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px",
    },
    imageTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      margin: 0,
    },
    closeButton: {
      fontSize: "14px",
      color: "#6b7280",
      background: "none",
      border: "none",
      cursor: "pointer",
    },
    canvasContainer: {
      backgroundColor: "#f3f4f6",
      borderRadius: "8px",
      padding: "16px",
    },
    canvasInstruction: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "12px",
    },
    canvas: {
      maxWidth: "100%",
      border: "2px solid #d1d5db",
      borderRadius: "8px",
      cursor: "crosshair",
      display: "block",
      margin: "0 auto",
      maxHeight: "400px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ color: "#4f46e5" }}>
            <PaletteIcon />
          </div>
          <h1 style={styles.title}>Acrylic Paint Mixer</h1>
        </div>

        {/* Color Picker Section */}
        <div style={styles.gridTwo}>
          <div>
            <label style={styles.label}>
              Click below to choose your colour
            </label>
            <div style={styles.colorPickerContainer}>
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                style={styles.colorInput}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Name your color..."
                  style={styles.textInput}
                />
                <p style={styles.hexDisplay}>{selectedColor}</p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.uploadButton}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#c7d2fe")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "#e0e7ff")
                  }
                >
                  <UploadIcon />
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={styles.label}>Color Preview</label>
            <div
              style={{
                ...styles.colorPreview,
                backgroundColor: selectedColor,
              }}
            />
          </div>
        </div>

        {/* Image Color Picker */}
        {uploadedImage && (
          <div style={styles.imageSection}>
            <div style={styles.imageHeader}>
              <h3 style={styles.imageTitle}>
                <ImageIcon />
                Pick Color from Photo
              </h3>
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setIsPickingFromImage(false);
                }}
                style={styles.closeButton}
              >
                Close Photo
              </button>
            </div>
            <div style={styles.canvasContainer}>
              <p style={styles.canvasInstruction}>
                Click anywhere on the image to pick a color
              </p>
              <canvas
                ref={canvasRef}
                onClick={handleImageClick}
                style={styles.canvas}
              />
            </div>
          </div>
        )}

        {/* Preset Colors */}
        <div style={{ marginBottom: "32px" }}>
          <h3 style={styles.sectionTitle}>Quick Color Selection</h3>
          <div style={styles.presetGrid}>
            {presetColors.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => selectPresetColor(preset)}
                style={styles.presetButton}
                onMouseOver={(e) => (e.target.style.borderColor = "#a855f7")}
                onMouseOut={(e) => (e.target.style.borderColor = "#e5e7eb")}
              >
                <div
                  style={{
                    ...styles.presetColor,
                    backgroundColor: preset.hex,
                  }}
                />
                <p style={styles.presetName}>{preset.name}</p>
                <p style={styles.presetDesc}>{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mixing Instructions */}
        <div style={styles.mixingSection}>
          <div style={styles.mixingHeader}>
            <div style={{ color: "#4f46e5" }}>
              <DropletIcon />
            </div>
            <h3 style={styles.mixingTitle}>Paint Mixing Recipe</h3>
          </div>

          <div style={styles.recipeCard}>
            <p style={styles.recipeName}>To create {colorName}:</p>
            <p style={styles.recipeInstructions}>{getMixingInstructions()}</p>

            {/* Visual Ratio */}
            {totalParts > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <p style={styles.visualRatioLabel}>Visual Ratio:</p>
                <div style={styles.paintBlobsContainer}>
                  {paintParts.cyan > 0 &&
                    [...Array(paintParts.cyan)].map((_, i) => (
                      <div
                        key={`cyan-${i}`}
                        style={{
                          ...styles.paintBlob,
                          backgroundColor: "#0069A5",
                          color: "white",
                        }}
                        title="Cyan"
                      >
                        C
                      </div>
                    ))}
                  {paintParts.magenta > 0 &&
                    [...Array(paintParts.magenta)].map((_, i) => (
                      <div
                        key={`magenta-${i}`}
                        style={{
                          ...styles.paintBlob,
                          backgroundColor: "#D5007F",
                          color: "white",
                        }}
                        title="Magenta"
                      >
                        M
                      </div>
                    ))}
                  {paintParts.yellow > 0 &&
                    [...Array(paintParts.yellow)].map((_, i) => (
                      <div
                        key={`yellow-${i}`}
                        style={{
                          ...styles.paintBlob,
                          backgroundColor: "#FFD700",
                          color: "#1f2937",
                        }}
                        title="Yellow"
                      >
                        Y
                      </div>
                    ))}
                  {paintParts.black > 0 &&
                    [...Array(paintParts.black)].map((_, i) => (
                      <div
                        key={`black-${i}`}
                        style={{
                          ...styles.paintBlob,
                          backgroundColor: "#1a1a1a",
                          color: "white",
                        }}
                        title="Black"
                      >
                        K
                      </div>
                    ))}
                  {paintParts.white > 0 &&
                    [...Array(paintParts.white)].map((_, i) => (
                      <div
                        key={`white-${i}`}
                        style={{
                          ...styles.paintBlob,
                          backgroundColor: "#FAFAFA",
                          color: "#374151",
                          border: "2px solid #d1d5db",
                        }}
                        title="White"
                      >
                        W
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Paint Parts Breakdown */}
          <div style={styles.partsGrid}>
            {[
              {
                color: "Cyan",
                value: paintParts.cyan,
                bg: "#0069A5",
                textColor: "white",
                paint: "Phthalo Blue (GS)",
              },
              {
                color: "Magenta",
                value: paintParts.magenta,
                bg: "#D5007F",
                textColor: "white",
                paint: "Quinacridone Magenta",
              },
              {
                color: "Yellow",
                value: paintParts.yellow,
                bg: "#FFD700",
                textColor: "#1f2937",
                paint: "Cadmium Yellow Medium",
              },
              {
                color: "Black",
                value: paintParts.black,
                bg: "#1a1a1a",
                textColor: "white",
                paint: "Carbon Black",
              },
              {
                color: "White",
                value: paintParts.white,
                bg: "#FAFAFA",
                textColor: "#374151",
                paint: "Titanium White",
                border: "2px solid #d1d5db",
              },
            ].map((ink) => (
              <div key={ink.color} style={styles.partCard}>
                <div
                  style={{
                    ...styles.partDisplay,
                    backgroundColor: ink.bg,
                    color: ink.textColor,
                    border: ink.border || "none",
                  }}
                >
                  <p style={styles.partNumber}>{ink.value}</p>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {renderPartsVisual(ink.value)}
                  </div>
                </div>
                <p style={styles.partColorName}>{ink.color}</p>
                <p style={styles.partPaintName}>{ink.paint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div style={styles.infoSection}>
          <div style={{ color: "#1e40af", marginTop: "2px" }}>
            <InfoIcon />
          </div>
          <div style={styles.infoText}>
            <p style={{ fontWeight: "500", marginBottom: "4px" }}>
              Artist-Friendly Mixing:
            </p>
            <p style={{ marginBottom: "8px" }}>
              Each recipe uses a maximum of 10 parts per color for practical
              mixing. Start with small amounts and adjust to taste.
            </p>
            <p style={{ fontSize: "12px", margin: 0 }}>
              <strong>Golden paint equivalents:</strong> Phthalo Blue (Green
              Shade), Quinacridone Magenta, Cadmium Yellow Medium Hue, Carbon
              Black, and Titanium White.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorMixerApp;
