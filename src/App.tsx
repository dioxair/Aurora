import "./App.css";
import { useState, useCallback, useRef, useEffect } from "react";

import { useTutorial, DUMMY_IMAGE_URL_FOR_CHECK } from "./useTutorial";
import { TutorialOverlay } from "./TutorialOverlay";

import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  //type ReactCropState,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu as MenuIcon, Plus, Minus } from "lucide-react";

const ASPECT_RATIO_OPTIONS = {
  FREE: "free",
  SQUARE: "1:1",
  STANDARD: "4:3",
  WIDESCREEN: "16:9",
};

interface CropInputValues {
  width: string;
  height: string;
  x: string;
  y: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tabValue, setTabValue] = useState("crop");
  const [fileType, setFileType] = useState("image/jpeg");
  const [aspectRatio, setAspectRatio] = useState<string>(
    ASPECT_RATIO_OPTIONS.FREE
  );
  const [cropInputValues, setCropInputValues] = useState<CropInputValues>({
    width: "",
    height: "",
    x: "",
    y: "",
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const fileInputContainerRef = useRef<HTMLDivElement>(null);
  const hamburgerMenuRef = useRef<HTMLButtonElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const generatePreviewButtonRef = useRef<HTMLButtonElement>(null);
  const previewTabTriggerRef = useRef<HTMLButtonElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const initialZoomAtPinchStartRef = useRef<number>(1);
  const initialPanAtPinchStartRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchMidpointRef = useRef<{ x: number; y: number } | null>(null);

  const ZOOM_STEP = 0.2;

  const updateCropInputDisplayValues = useCallback(
    (displayPixelCrop: PixelCrop | undefined) => {
      if (
        displayPixelCrop &&
        imgRef.current &&
        imgRef.current.width > 0 &&
        imgRef.current.height > 0
      ) {
        const imageElement = imgRef.current;
        // scale factors :nauseated_face:
        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;

        const cropXOnImageContentScaled = displayPixelCrop.x - pan.x;
        const cropYOnImageContentScaled = displayPixelCrop.y - pan.y;

        setCropInputValues({
          width: String(Math.round((displayPixelCrop.width / zoom) * scaleX)),
          height: String(Math.round((displayPixelCrop.height / zoom) * scaleY)),
          x: String(Math.round((cropXOnImageContentScaled / zoom) * scaleX)),
          y: String(Math.round((cropYOnImageContentScaled / zoom) * scaleY)),
        });
      } else if (!displayPixelCrop) {
        setCropInputValues({ width: "", height: "", x: "", y: "" });
      }
    },
    [imgRef, zoom, pan, setCropInputValues]
  );

  const {
    showTutorial,
    setShowTutorial,
    tutorialStep,
    setTutorialStep,
    handleNextTutorialStep,
    handleSkipTutorial,
  } = useTutorial({
    isMobileView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    imageSrc,
    setImageSrc,
    setFileType,
    setOriginalFileName,
    appCropState: crop,
    setCrop,
    appCompletedCropState: completedCrop,
    setCompletedCrop,
    setCroppedImage,
    appTabValue: tabValue,
    setTabValue,
    imgRef,
    aspectRatio,
    updateSidebarInputs: updateCropInputDisplayValues,
    triggerHandleCropImage: async () => handleCropImage(),
    centerAspectCropFn: centerAspectCrop,
    interactionRefs: {
      hamburgerMenuRef,
      generatePreviewButtonRef,
      previewTabTriggerRef,
    },
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (imageSrc) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [imageSrc]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setFileType(file.type);
        setOriginalFileName(file.name);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setCroppedImage(null);
        setTabValue("crop");
        setZoom(1);
        setPan({ x: 0, y: 0 });
        if (showTutorial && tutorialStep === 2) {
          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          setTutorialStep(3);
        }
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imageElement = e.currentTarget;
    const {
      naturalWidth,
      naturalHeight,
      width: layoutWidth,
      height: layoutHeight,
    } = imageElement;

    const cropIsEffectivelyEmpty =
      !crop || (crop.width === 0 && crop.height === 0);

    if (
      cropIsEffectivelyEmpty ||
      (imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial)
    ) {
      let currentPanToUse = pan;
      let currentZoomToUse = zoom;

      if (imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial) {
        currentPanToUse = { x: 0, y: 0 };
        currentZoomToUse = 1;
      }

      let initialAspect = 1 / 1;
      if (
        aspectRatio !== ASPECT_RATIO_OPTIONS.FREE &&
        !(imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial)
      ) {
        const parts = aspectRatio.split(":");
        if (parts.length === 2) {
          const num = parseFloat(parts[0]);
          const den = parseFloat(parts[1]);
          if (!isNaN(num) && !isNaN(den) && den !== 0) {
            initialAspect = num / den;
          }
        }
      } else if (naturalWidth && naturalHeight) {
        initialAspect = naturalWidth / naturalHeight;
      }

      const newPercentCrop = centerAspectCrop(
        naturalWidth,
        naturalHeight,
        initialAspect || 1
      );

      const pixelCropTargetWidth = layoutWidth * currentZoomToUse;
      const pixelCropTargetHeight = layoutHeight * currentZoomToUse;

      const contentRelativeInitialPixelCrop = convertToPixelCrop(
        newPercentCrop,
        pixelCropTargetWidth,
        pixelCropTargetHeight
      );

      const viewportRelativeInitialCrop = {
        ...contentRelativeInitialPixelCrop,
        x: contentRelativeInitialPixelCrop.x + currentPanToUse.x,
        y: contentRelativeInitialPixelCrop.y + currentPanToUse.y,
      };
      setCrop(viewportRelativeInitialCrop);

      const completedCropIsEffectivelyEmpty =
        !completedCrop ||
        (completedCrop.width === 0 && completedCrop.height === 0);
      if (
        completedCropIsEffectivelyEmpty ||
        (imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial)
      ) {
        setCompletedCrop(viewportRelativeInitialCrop);
        updateCropInputDisplayValues(viewportRelativeInitialCrop);
      }
    }
  };

  const sanitizeNumericInput = (
    inputValue: string
  ): { valueForState: string; numericValue: number } => {
    let valueForState = "";
    let numericValue: number = NaN;

    if (inputValue.trim() === "") {
      valueForState = "";
    } else if (inputValue.includes("-") || /[a-zA-Z]/.test(inputValue)) {
      valueForState = "";
    } else {
      const potentialNumber = Number(inputValue);

      if (!isNaN(potentialNumber) && potentialNumber >= 0) {
        numericValue = potentialNumber;
        valueForState = potentialNumber.toString();
      } else {
        valueForState = "";
      }
    }
    return { valueForState, numericValue };
  };

  const updateSidebarInputs = updateCropInputDisplayValues;

  const onCropChange = (
    displayPixelCrop: PixelCrop /*, percentCrop: Crop*/
  ) => {
    setCrop(displayPixelCrop);
    updateSidebarInputs(displayPixelCrop);
  };

  const handleCropComplete = useCallback(
    (displayPixelCrop: PixelCrop) => {
      setCompletedCrop(displayPixelCrop);
      updateSidebarInputs(displayPixelCrop);
    },
    [updateSidebarInputs]
  );

  const handleCropInputChange = (
    inputValue: string,
    dimension: keyof CropInputValues
  ) => {
    const {
      valueForState: processedStringForState,
      numericValue: numericValueForLogic,
    } = sanitizeNumericInput(inputValue);

    setCropInputValues((prev) => ({
      ...prev,
      [dimension]: processedStringForState,
    }));

    if (
      !isNaN(numericValueForLogic) &&
      imgRef.current &&
      imgRef.current.width > 0 &&
      imgRef.current.height > 0 &&
      crop
    ) {
      const imageElement = imgRef.current;
      const layoutToNaturalScaleX =
        imageElement.naturalWidth / imageElement.width;
      const layoutToNaturalScaleY =
        imageElement.naturalHeight / imageElement.height;

      setCrop((prevDisplayCrop) => {
        if (!prevDisplayCrop) return prevDisplayCrop;

        const newScaledVisualDimValue = (value: number, scaleFactor: number) =>
          (value / scaleFactor) * zoom;
        const newScaledVisualPosValue = (
          value: number,
          scaleFactor: number,
          panOffset: number
        ) => (value / scaleFactor) * zoom + panOffset;

        const currentContentRelativeCrop =
          prevDisplayCrop.unit === "%"
            ? convertToPixelCrop(
                prevDisplayCrop,
                imageElement.width * zoom,
                imageElement.height * zoom
              )
            : {
                ...prevDisplayCrop,
                x: prevDisplayCrop.x - pan.x,
                y: prevDisplayCrop.y - pan.y,
              };

        const viewportRelativeCurrentDisplayCrop = {
          ...currentContentRelativeCrop,
          x: currentContentRelativeCrop.x + pan.x,
          y: currentContentRelativeCrop.y + pan.y,
          unit: "px",
          width: currentContentRelativeCrop.width,
          height: currentContentRelativeCrop.height,
        };

        const newDisplayPixelValues: Partial<PixelCrop> = { unit: "px" };

        if (dimension === "width")
          newDisplayPixelValues.width = newScaledVisualDimValue(
            numericValueForLogic,
            layoutToNaturalScaleX
          );
        else if (dimension === "height")
          newDisplayPixelValues.height = newScaledVisualDimValue(
            numericValueForLogic,
            layoutToNaturalScaleY
          );
        else if (dimension === "x")
          newDisplayPixelValues.x = newScaledVisualPosValue(
            numericValueForLogic,
            layoutToNaturalScaleX,
            pan.x
          );
        else if (dimension === "y")
          newDisplayPixelValues.y = newScaledVisualPosValue(
            numericValueForLogic,
            layoutToNaturalScaleY,
            pan.y
          );

        const updatedDisplayCrop = {
          ...viewportRelativeCurrentDisplayCrop,
          ...newDisplayPixelValues,
        } as PixelCrop;

        // here comes a bunch of shit to clamp width and height to the actual image, so fun!!!
        const scaledLayoutWidth = imageElement.width * zoom;
        const scaledLayoutHeight = imageElement.height * zoom;

        updatedDisplayCrop.x = Math.max(pan.x, updatedDisplayCrop.x);
        updatedDisplayCrop.y = Math.max(pan.y, updatedDisplayCrop.y);

        if (dimension === "width" || dimension === "x") {
          updatedDisplayCrop.width = Math.max(1, updatedDisplayCrop.width || 0);
          updatedDisplayCrop.width = Math.min(
            updatedDisplayCrop.width,
            scaledLayoutWidth + pan.x - updatedDisplayCrop.x
          );
        }
        if (dimension === "height" || dimension === "y") {
          updatedDisplayCrop.height = Math.max(
            1,
            updatedDisplayCrop.height || 0
          );
          updatedDisplayCrop.height = Math.min(
            updatedDisplayCrop.height,
            scaledLayoutHeight + pan.y - updatedDisplayCrop.y
          );
        }

        updatedDisplayCrop.x = Math.min(
          updatedDisplayCrop.x,
          scaledLayoutWidth + pan.x - (updatedDisplayCrop.width || 0)
        );
        updatedDisplayCrop.y = Math.min(
          updatedDisplayCrop.y,
          scaledLayoutHeight + pan.y - (updatedDisplayCrop.height || 0)
        );

        if (updatedDisplayCrop.width < 1) updatedDisplayCrop.width = 1;
        if (updatedDisplayCrop.height < 1) updatedDisplayCrop.height = 1;

        setCompletedCrop(updatedDisplayCrop);
        return updatedDisplayCrop;
      });
    }
    return null;
  };

  const generateCroppedPreview = useCallback(() => {
    if (
      !imageSrc ||
      !completedCrop ||
      !imgRef.current ||
      !previewCanvasRef.current
    ) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const imageContentXOnScaledImage = completedCrop.x - pan.x;
    const imageContentYOnScaledImage = completedCrop.y - pan.y;
    const imageContentWidthOnScaledImage = completedCrop.width;
    const imageContentHeightOnScaledImage = completedCrop.height;

    const unscaledCropX = imageContentXOnScaledImage / zoom;
    const unscaledCropY = imageContentYOnScaledImage / zoom;
    const unscaledCropWidth = imageContentWidthOnScaledImage / zoom;
    const unscaledCropHeight = imageContentHeightOnScaledImage / zoom;

    const layoutToNaturalScaleX = image.naturalWidth / image.width;
    const layoutToNaturalScaleY = image.naturalHeight / image.height;

    // using natural dimensions for good quality crop result
    const naturalCropX = unscaledCropX * layoutToNaturalScaleX;
    const naturalCropY = unscaledCropY * layoutToNaturalScaleY;
    const naturalCropWidth = unscaledCropWidth * layoutToNaturalScaleX;
    const naturalCropHeight = unscaledCropHeight * layoutToNaturalScaleY;

    canvas.width = Math.max(1, naturalCropWidth);
    canvas.height = Math.max(1, naturalCropHeight);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      // scaleX and scaleY means drawing the cropped area at original resolution
      naturalCropX,
      naturalCropY,
      naturalCropWidth,
      naturalCropHeight,
      0,
      0,
      naturalCropWidth,
      naturalCropHeight
    );

    setCroppedImage(canvas.toDataURL(fileType));
  }, [
    imageSrc,
    completedCrop,
    fileType,
    zoom,
    pan,
    imgRef,
    previewCanvasRef,
    setCroppedImage,
  ]);

  const handleCropImage = useCallback(async () => {
    if (!imageSrc || !completedCrop || !imgRef.current) return;
    generateCroppedPreview();
    setTabValue("preview");
    if (showTutorial && tutorialStep === 4) {
      setTutorialStep(5);
    }
  }, [
    imageSrc,
    completedCrop,
    generateCroppedPreview,
    showTutorial,
    tutorialStep,
    setTutorialStep,
    setTabValue,
  ]);

  const getDownloadFileName = () => {
    if (!originalFileName || !previewCanvasRef.current) {
      return `cropped-image.${fileType.split("/")[1] || "jpg"}`;
    }

    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
    const extension = fileType.split("/")[1] || "jpg";
    const width = previewCanvasRef.current.width;
    const height = previewCanvasRef.current.height;

    return `${baseName} (${width}x${height}).${extension}`;
  };

  const handleReset = () => {
    if (
      imgRef.current &&
      imageSrc &&
      imgRef.current.width > 0 &&
      imgRef.current.height > 0
    ) {
      const imageElement = imgRef.current;
      const {
        naturalWidth,
        naturalHeight,
        width: layoutWidth,
        height: layoutHeight,
      } = imageElement;

      const newZoom = 1;
      const newPan = { x: 0, y: 0 };
      setZoom(newZoom);
      setPan(newPan);

      const resetAspect =
        aspectRatio === ASPECT_RATIO_OPTIONS.FREE
          ? 1 / 1
          : parseFloat(aspectRatio.split(":")[0]) /
              parseFloat(aspectRatio.split(":")[1]) || 1 / 1;

      const newPercentCrop = centerAspectCrop(
        naturalWidth,
        naturalHeight,
        resetAspect
      );

      const pixelCropTargetWidth = layoutWidth * newZoom;
      const pixelCropTargetHeight = layoutHeight * newZoom;

      const contentRelativePixelCrop = convertToPixelCrop(
        newPercentCrop,
        pixelCropTargetWidth,
        pixelCropTargetHeight
      );

      const viewportRelativePixelCrop = {
        ...contentRelativePixelCrop,
        x: contentRelativePixelCrop.x + newPan.x,
        y: contentRelativePixelCrop.y + newPan.y,
      };

      setCrop(viewportRelativePixelCrop);
      setCompletedCrop(viewportRelativePixelCrop);
      updateSidebarInputs(viewportRelativePixelCrop);
    }
    setAspectRatio(ASPECT_RATIO_OPTIONS.FREE);
  };

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const handleRestartTutorial = () => {
    localStorage.removeItem("auroraTutorialCompleted");
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const handleGitHubRepoVisit = () => {
    window.open("https://github.com/dioxair/Aurora");
  };

  const handleManualZoom = useCallback(
    (newZoomLevel: number) => {
      if (!cropAreaRef.current || !imgRef.current) return;

      const oldZoom = zoom;
      const newZoomCandidate = Math.max(0.1, Math.min(newZoomLevel, 10));

      if (newZoomCandidate === oldZoom) return;

      const rect = cropAreaRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const newPanX =
        centerX - ((centerX - pan.x) / oldZoom) * newZoomCandidate;
      const newPanY =
        centerY - ((centerY - pan.y) / oldZoom) * newZoomCandidate;

      setZoom(newZoomCandidate);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan, setZoom, setPan, cropAreaRef, imgRef]
  );

  const zoomIn = useCallback(() => {
    handleManualZoom(zoom + ZOOM_STEP);
  }, [handleManualZoom, zoom]);

  const zoomOut = useCallback(() => {
    handleManualZoom(zoom - ZOOM_STEP);
  }, [handleManualZoom, zoom]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!imgRef.current || !cropAreaRef.current) return;
      event.preventDefault();

      const rect = cropAreaRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const zoomFactor = 0.1;
      const delta = event.deltaY > 0 ? -1 : 1;
      const newZoomLevel = zoom * (1 + delta * zoomFactor);

      const oldZoom = zoom;
      const newZoomClamped = Math.max(0.1, Math.min(newZoomLevel, 10));

      if (newZoomClamped === oldZoom) return;

      const newPanX = mouseX - ((mouseX - pan.x) / oldZoom) * newZoomClamped;
      const newPanY = mouseY - ((mouseY - pan.y) / oldZoom) * newZoomClamped;

      setZoom(newZoomClamped);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan, setZoom, setPan]
  );

  const handlePinchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2 && cropAreaRef.current) {
        event.preventDefault();
        const t1 = event.touches[0];
        const t2 = event.touches[1];

        initialPinchDistanceRef.current = Math.sqrt(
          Math.pow(t1.clientX - t2.clientX, 2) +
            Math.pow(t1.clientY - t2.clientY, 2)
        );
        initialZoomAtPinchStartRef.current = zoom;
        initialPanAtPinchStartRef.current = pan;

        const rect = cropAreaRef.current.getBoundingClientRect();
        initialPinchMidpointRef.current = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      }
    },
    [zoom, pan]
  );

  const handlePinchMove = useCallback(
    (event: React.TouchEvent) => {
      if (
        event.touches.length === 2 &&
        initialPinchDistanceRef.current !== null &&
        initialPinchMidpointRef.current &&
        cropAreaRef.current
      ) {
        event.preventDefault();
        const t1 = event.touches[0];
        const t2 = event.touches[1];

        const currentDist = Math.sqrt(
          Math.pow(t1.clientX - t2.clientX, 2) +
            Math.pow(t1.clientY - t2.clientY, 2)
        );
        const scaleChange = currentDist / initialPinchDistanceRef.current;
        const newZoomCandidate =
          initialZoomAtPinchStartRef.current * scaleChange;

        const oldZoomForPanCalc = initialZoomAtPinchStartRef.current;
        const newZoomClamped = Math.max(0.1, Math.min(newZoomCandidate, 10));

        if (
          newZoomClamped === oldZoomForPanCalc &&
          event.touches.length === 2
        ) {
          const rect = cropAreaRef.current.getBoundingClientRect();
          const currentMidpoint = {
            x: (t1.clientX + t2.clientX) / 2 - rect.left,
            y: (t1.clientY + t2.clientY) / 2 - rect.top,
          };
          const dragX = currentMidpoint.x - initialPinchMidpointRef.current.x;
          const dragY = currentMidpoint.y - initialPinchMidpointRef.current.y;
          setPan({
            x: initialPanAtPinchStartRef.current.x + dragX,
            y: initialPanAtPinchStartRef.current.y + dragY,
          });
          return;
        }
        if (newZoomClamped === zoom) return;

        const initialMidpoint = initialPinchMidpointRef.current;
        const initialPanVal = initialPanAtPinchStartRef.current;

        let newPanX =
          initialMidpoint.x -
          ((initialMidpoint.x - initialPanVal.x) / oldZoomForPanCalc) *
            newZoomClamped;
        let newPanY =
          initialMidpoint.y -
          ((initialMidpoint.y - initialPanVal.y) / oldZoomForPanCalc) *
            newZoomClamped;

        const rect = cropAreaRef.current.getBoundingClientRect();
        const currentMidpoint = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
        const dragX = currentMidpoint.x - initialMidpoint.x;
        const dragY = currentMidpoint.y - initialMidpoint.y;

        newPanX += dragX;
        newPanY += dragY;

        setZoom(newZoomClamped);
        setPan({ x: newPanX, y: newPanY });
      }
    },
    [zoom, pan, setZoom, setPan]
  );

  const handlePinchEnd = useCallback((event: React.TouchEvent) => {
    if (event.touches.length < 2) {
      initialPinchDistanceRef.current = null;
      initialPinchMidpointRef.current = null;
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex md:flex-row h-screen bg-background overflow-hidden">
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-3/4 sm:w-64 
            transform ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }
            transition-transform duration-300 ease-in-out
            bg-background p-4 border-r
            flex flex-col gap-6 overflow-y-auto
            md:static md:translate-x-0 md:w-64 md:h-screen 
            md:border-b-0 md:shrink-0 md:z-auto
          `}
        >
          <div className="space-y-4">
            <h3 className="text-white font-medium">File Picker</h3>
            <div ref={fileInputContainerRef} className="space-y-2">
              {" "}
              <Input type="file" accept="image/*" onChange={onFileChange} />
            </div>

            <h3 className="text-white font-medium">Crop Selection</h3>
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={cropInputValues.width}
                onChange={(e) => handleCropInputChange(e.target.value, "width")}
                placeholder="px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={cropInputValues.height}
                onChange={(e) =>
                  handleCropInputChange(e.target.value, "height")
                }
                placeholder="px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={(value) => {
                  setAspectRatio(value);
                  if (imgRef.current && imageSrc) {
                    const imageElement = imgRef.current;
                    const {
                      naturalWidth,
                      naturalHeight,
                      width: displayWidth,
                      height: displayHeight,
                    } = imageElement;
                    let newAspectVal = 1 / 1;
                    if (value !== ASPECT_RATIO_OPTIONS.FREE) {
                      const parts = value.split(":");
                      if (parts.length === 2) {
                        newAspectVal =
                          parseFloat(parts[0]) / parseFloat(parts[1]);
                      }
                    } else if (naturalWidth && naturalHeight) {
                      newAspectVal = naturalWidth / naturalHeight;
                    }
                    const newCenteredPercentCrop = centerAspectCrop(
                      naturalWidth,
                      naturalHeight,
                      newAspectVal || 1
                    );

                    const pixelCropTargetWidth = displayWidth * zoom;
                    const pixelCropTargetHeight = displayHeight * zoom;

                    const contentRelativeNewPixelCrop = convertToPixelCrop(
                      newCenteredPercentCrop,
                      pixelCropTargetWidth,
                      pixelCropTargetHeight
                    );
                    const viewportRelativeNewPixelCrop = {
                      ...contentRelativeNewPixelCrop,
                      x: contentRelativeNewPixelCrop.x + pan.x,
                      y: contentRelativeNewPixelCrop.y + pan.y,
                    };
                    setCrop(viewportRelativeNewPixelCrop);
                    setCompletedCrop(viewportRelativeNewPixelCrop);
                    updateSidebarInputs(viewportRelativeNewPixelCrop);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASPECT_RATIO_OPTIONS.FREE}>
                    Free Form
                  </SelectItem>
                  <SelectItem value={ASPECT_RATIO_OPTIONS.SQUARE}>
                    1:1 (Square)
                  </SelectItem>
                  <SelectItem value={ASPECT_RATIO_OPTIONS.STANDARD}>
                    4:3 (Standard)
                  </SelectItem>
                  <SelectItem value={ASPECT_RATIO_OPTIONS.WIDESCREEN}>
                    16:9 (Widescreen)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleReset}
              >
                Reset crop selection
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-medium">Crop Position</h3>
            <div className="space-y-2">
              <Label htmlFor="position-x">Position (X)</Label>
              <Input
                id="position-x"
                value={cropInputValues.x}
                onChange={(e) => handleCropInputChange(e.target.value, "x")}
                placeholder="px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-y">Position (Y)</Label>
              <Input
                id="position-y"
                value={cropInputValues.y}
                onChange={(e) => handleCropInputChange(e.target.value, "y")}
                placeholder="px"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-medium">Zoom Controls</h3>
            <div className="flex items-center justify-start gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={!imageSrc || zoom <= 0.1}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={!imageSrc || zoom >= 10}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResetView}
            >
              Reset view
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-medium">Misc.</h3>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleRestartTutorial}
            >
              Restart tutorial
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGitHubRepoVisit}
            >
              See GitHub repository
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-y-auto md:justify-center md:h-auto">
          <div className="p-2 md:hidden sticky top-0 bg-background z-20 flex items-center">
            <Button
              variant="ghost"
              ref={hamburgerMenuRef}
              size="icon"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (showTutorial && tutorialStep === 1 && isMobileView) {
                  handleNextTutorialStep();
                }
              }}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
            {/* Possible hamburger menu header (ex: <h2 className="ml-2 text-lg font-semibold">Advanced</h2>) */}
          </div>

          <div className="flex-grow flex flex-col items-center w-full p-2 sm:p-4 md:p-4 md:justify-center">
            <Card
              className="w-full max-w-lg"
              style={{ maxHeight: "fit-content" }}
            >
              <CardHeader>
                <CardTitle>Aurora</CardTitle>
                <CardDescription>
                  Easily crop your images locally and privately, with a modern
                  UI.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className={imageSrc ? "flex-1 overflow-auto" : ""}>
                <Tabs
                  value={tabValue}
                  onValueChange={setTabValue}
                  className="w-full"
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="crop">Crop</TabsTrigger>
                    <TabsTrigger ref={previewTabTriggerRef} value="preview">
                      {" "}
                      Preview & Download
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="crop">
                    <div className="flex flex-col gap-4">
                      {imageSrc ? (
                        <div
                          ref={cropAreaRef}
                          className="relative w-full flex-1 flex items-center justify-center bg-[rgba(0,0,0,0.3)] min-h-[300px] overflow-hidden"
                          onWheel={handleWheel}
                          onTouchStart={handlePinchStart}
                          onTouchMove={handlePinchMove}
                          onTouchEnd={handlePinchEnd}
                          style={{ touchAction: "none" }}
                        >
                          {" "}
                          <ReactCrop
                            crop={crop}
                            onChange={onCropChange}
                            onComplete={handleCropComplete}
                            aspect={
                              aspectRatio === ASPECT_RATIO_OPTIONS.FREE
                                ? undefined
                                : parseFloat(aspectRatio.split(":")[0]) /
                                  parseFloat(aspectRatio.split(":")[1])
                            }
                            className="max-h-full max-w-full"
                            ruleOfThirds={true}
                            renderSelectionAddon={
                              (/*state: ReactCropState*/) => (
                                <div className="react-crop-selection-addon">
                                  {/*
                                  Vertical and horizontal lines stemming from the crosshair
                                  i MIGHT add an option for this later 
                                  
                                  <div className="crosshair-v" />
                                  <div className="crosshair-h" />
          
                                  */}
                                  <div className="crosshair-dot" />
                                </div>
                              )
                            }
                          >
                            <img
                              ref={imgRef}
                              src={imageSrc}
                              onLoad={onImageLoad}
                              className="max-h-full max-w-full object-contain"
                              alt="Crop preview"
                              style={{
                                maxHeight: "calc(100vh - 300px)",
                                maxWidth: "100%",
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: "0 0",
                                cursor: "grab",
                              }}
                            />
                          </ReactCrop>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center bg-[rgba(0,0,0,0.3)] min-h-[200px] rounded-lg">
                          <p>No image selected</p>
                        </div>
                      )}
                      <Button
                        onClick={handleCropImage}
                        ref={generatePreviewButtonRef}
                        disabled={
                          !imageSrc ||
                          !crop ||
                          !completedCrop ||
                          completedCrop.width === 0 ||
                          completedCrop.height === 0
                        }
                      >
                        Generate Preview
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="flex flex-col gap-4">
                      {croppedImage ? (
                        <>
                          <div className="relative w-full flex-1 flex items-center justify-center bg-[rgba(0,0,0,0.3)] min-h-[300px] rounded-lg">
                            <img
                              src={croppedImage}
                              className="max-h-full max-w-full object-contain rounded-lg"
                              alt="Cropped preview"
                              style={{
                                maxHeight: "calc(100vh - 300px)",
                                maxWidth: "100%",
                              }}
                            />
                          </div>
                          <Button asChild className="w-full">
                            <a
                              href={croppedImage}
                              ref={downloadLinkRef}
                              download={getDownloadFileName()}
                              onClick={() => {
                                if (showTutorial && tutorialStep === 6) {
                                  handleNextTutorialStep();
                                }
                              }}
                            >
                              Download Image
                            </a>
                          </Button>
                        </>
                      ) : (
                        <Alert>
                          <AlertTitle>No Preview Available</AlertTitle>
                          <AlertDescription>
                            Crop an image first and click "Generate Preview" to
                            see the result here.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <canvas ref={previewCanvasRef} className="hidden" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  © 2025 Samuel Olagunju
                </span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {showTutorial && (
        <TutorialOverlay
          step={tutorialStep}
          isMobile={isMobileView}
          targetRefs={{
            fileInput: fileInputContainerRef,
            hamburgerMenu: hamburgerMenuRef,
            cropArea: cropAreaRef,
            generatePreviewButton: generatePreviewButtonRef,
            previewTabTrigger: previewTabTriggerRef,
            downloadLink: downloadLinkRef,
          }}
          onNext={handleNextTutorialStep}
          onSkip={handleSkipTutorial}
          isMobileMenuOpen={isMobileMenuOpen}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
