import "./App.css";
import { useState, useCallback, useRef, useEffect } from "react";
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
import { Menu as MenuIcon } from "lucide-react";

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
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  const [cropWidth, setCropWidth] = useState<string>("");
  const [cropHeight, setCropHeight] = useState<string>("");
  const [positionX, setPositionX] = useState<string>("");
  const [positionY, setPositionY] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const fileInputContainerRef = useRef<HTMLDivElement>(null);
  const hamburgerMenuRef = useRef<HTMLButtonElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const generatePreviewButtonRef = useRef<HTMLButtonElement>(null);
  const previewTabTriggerRef = useRef<HTMLButtonElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const DUMMY_IMAGE_URL = "https://picsum.photos/600/400";
  const ANOTHER_DUMMY_IMAGE =
    "https://files.samola.net/r/backup_sample_(image_by_ALPCMAS).jpg";
  const DUMMY_FILE_NAME = "sample-image.jpg";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const tutorialCompleted = localStorage.getItem("auroraTutorialCompleted");
    if (!tutorialCompleted) {
      setShowTutorial(true);
      setTutorialStep(0);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadDummyImageForTutorial = useCallback(() => {
    if (!imageSrc || showTutorial) {
      fetch(DUMMY_IMAGE_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageSrc(reader.result as string);
            setFileType("image/jpeg"); // Picsum usually serves jpeg
            setOriginalFileName(DUMMY_FILE_NAME);
            setCrop(undefined); // Crucial: Reset crop so onImageLoad can set a new one
            setCompletedCrop(undefined);
            setCroppedImage(null);
            setTabValue("crop"); // Ensure user is on crop tab
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error(
            "Error fetching dummy image, falling back to a hardcoded one\nError:",
            error
          );

          fetch(ANOTHER_DUMMY_IMAGE)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.blob();
            })
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                setImageSrc(reader.result as string);
                setFileType("image/jpeg");
                setOriginalFileName(DUMMY_FILE_NAME);
                setCrop(undefined);
                setCompletedCrop(undefined);
                setCroppedImage(null);
                setTabValue("crop");
              };
              reader.readAsDataURL(blob);
            });
        });
    }
  }, [imageSrc, showTutorial]);

  const handleNextTutorialStep = () => {
    const currentStep = tutorialStep;
    const mobile = isMobileView;
    let nextStepState = -1;

    if (currentStep === 0) {
      nextStepState = mobile ? 1 : 2;
    } else if (mobile && currentStep === 1) {
      if (hamburgerMenuRef.current && !isMobileMenuOpen) {
        hamburgerMenuRef.current.click();
      }
      nextStepState = 2;
    } else if (currentStep === 2) {
      if (!imageSrc) {
        loadDummyImageForTutorial();
      }
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      nextStepState = 3;
    } else if (currentStep === 3) {
      if (
        imageSrc === DUMMY_IMAGE_URL &&
        !crop &&
        imgRef.current &&
        imgRef.current.naturalWidth > 0
      ) {
        const {
          naturalWidth,
          naturalHeight,
          width: displayWidth,
          height: displayHeight,
        } = imgRef.current;
        const aspectToUse =
          aspectRatio === "free"
            ? displayWidth / displayHeight
            : parseFloat(aspectRatio.split(":")[0]) /
              parseFloat(aspectRatio.split(":")[1]);
        const initialCrop = centerAspectCrop(
          naturalWidth,
          naturalHeight,
          aspectToUse || 1
        );
        setCrop(initialCrop);
        const displayPixelCrop = convertToPixelCrop(
          initialCrop,
          displayWidth,
          displayHeight
        );
        setCompletedCrop(displayPixelCrop);
        updateSidebarInputs(displayPixelCrop);
      }
      nextStepState = 4;
    } else if (currentStep === 4) {
      if (
        generatePreviewButtonRef.current &&
        !generatePreviewButtonRef.current.disabled
      ) {
        generatePreviewButtonRef.current.click();
      } else if (imageSrc && (completedCrop || crop)) {
        // Fallback
        handleCropImage();
      }
      nextStepState = 5;
    } else if (currentStep === 5) {
      if (previewTabTriggerRef.current && tabValue !== "preview") {
        previewTabTriggerRef.current.click();
      } else {
        setTabValue("preview");
      }
      nextStepState = 6;
    } else if (currentStep === 6) {
      setShowTutorial(false);
      localStorage.setItem("auroraTutorialCompleted", "true");
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      return;
    }

    if (nextStepState !== -1) {
      setTutorialStep(nextStepState);
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("auroraTutorialCompleted", "true");
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    if (imageSrc === DUMMY_IMAGE_URL) {
      // Reset if dummy was loaded
      setImageSrc(null);
      setOriginalFileName(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCroppedImage(null);
    }
  };

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
      width: displayWidth,
      height: displayHeight,
    } = imageElement;

    if (!crop || (imageSrc === DUMMY_IMAGE_URL && showTutorial)) {
      let initialAspect = 1 / 1;
      if (
        aspectRatio !== "free" &&
        !(imageSrc === DUMMY_IMAGE_URL && showTutorial)
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
      setCrop(newPercentCrop);
      if ((imageSrc === DUMMY_IMAGE_URL && showTutorial) || !completedCrop) {
        const displayPixelCropVal = convertToPixelCrop(
          newPercentCrop,
          displayWidth,
          displayHeight
        );
        setCompletedCrop(displayPixelCropVal);
        updateSidebarInputs(displayPixelCropVal);
      }
    }
  };

  const updateSidebarInputs = (displayPixelCrop: PixelCrop | undefined) => {
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

      setCropWidth(String(Math.round(displayPixelCrop.width * scaleX)));
      setCropHeight(String(Math.round(displayPixelCrop.height * scaleY)));
      setPositionX(String(Math.round(displayPixelCrop.x * scaleX)));
      setPositionY(String(Math.round(displayPixelCrop.y * scaleY)));
    } else if (!displayPixelCrop) {
      setCropWidth("");
      setCropHeight("");
      setPositionX("");
      setPositionY("");
    }
  };

  const onCropChange = (
    displayPixelCrop: PixelCrop /*, percentCrop: Crop*/
  ) => {
    setCrop(displayPixelCrop);
    updateSidebarInputs(displayPixelCrop);
  };

  const handleCropComplete = useCallback((displayPixelCrop: PixelCrop) => {
    setCompletedCrop(displayPixelCrop);
    updateSidebarInputs(displayPixelCrop);
  }, []);

  const handleCropDimensionChange = (
    inputValue: string,
    dimension: "width" | "height" | "x" | "y"
  ) => {
    if (dimension === "width") setCropWidth(inputValue);
    else if (dimension === "height") setCropHeight(inputValue);
    else if (dimension === "x") setPositionX(inputValue);
    else if (dimension === "y") setPositionY(inputValue);

    const naturalNumericValue = parseInt(inputValue, 10);

    if (
      !isNaN(naturalNumericValue) &&
      imgRef.current &&
      imgRef.current.width > 0 &&
      imgRef.current.height > 0 &&
      crop // crop is the current crop for the display image
    ) {
      const imageElement = imgRef.current;
      const displayToNaturalScaleX =
        imageElement.naturalWidth / imageElement.width;
      const displayToNaturalScaleY =
        imageElement.naturalHeight / imageElement.height;

      setCrop((prevDisplayCrop) => {
        if (!prevDisplayCrop) return prevDisplayCrop;

        const currentDisplayPixelCrop =
          prevDisplayCrop.unit === "%"
            ? convertToPixelCrop(
                prevDisplayCrop,
                imageElement.width,
                imageElement.height
              )
            : (prevDisplayCrop as PixelCrop);

        const newDisplayPixelValues: Partial<PixelCrop> = { unit: "px" };

        if (dimension === "width")
          newDisplayPixelValues.width =
            naturalNumericValue / displayToNaturalScaleX;
        else if (dimension === "height")
          newDisplayPixelValues.height =
            naturalNumericValue / displayToNaturalScaleY;
        else if (dimension === "x")
          newDisplayPixelValues.x =
            naturalNumericValue / displayToNaturalScaleX;
        else if (dimension === "y")
          newDisplayPixelValues.y =
            naturalNumericValue / displayToNaturalScaleY;

        const updatedDisplayCrop = {
          ...currentDisplayPixelCrop,
          ...newDisplayPixelValues,
        } as PixelCrop;

        // here comes a bunch of shit to clamp width and height to the actual image, so fun!!!
        const displayWidth = imageElement.width;
        const displayHeight = imageElement.height;

        updatedDisplayCrop.x = Math.max(0, updatedDisplayCrop.x);
        updatedDisplayCrop.y = Math.max(0, updatedDisplayCrop.y);

        if (dimension === "width" || dimension === "x") {
          updatedDisplayCrop.width = Math.max(1, updatedDisplayCrop.width || 0);
          updatedDisplayCrop.width = Math.min(
            updatedDisplayCrop.width,
            displayWidth - updatedDisplayCrop.x
          );
        }
        if (dimension === "height" || dimension === "y") {
          updatedDisplayCrop.height = Math.max(
            1,
            updatedDisplayCrop.height || 0
          );
          updatedDisplayCrop.height = Math.min(
            updatedDisplayCrop.height,
            displayHeight - updatedDisplayCrop.y
          );
        }

        updatedDisplayCrop.x = Math.min(
          updatedDisplayCrop.x,
          displayWidth - (updatedDisplayCrop.width || 0)
        );
        updatedDisplayCrop.y = Math.min(
          updatedDisplayCrop.y,
          displayHeight - (updatedDisplayCrop.height || 0)
        );
        if (updatedDisplayCrop.width < 1) updatedDisplayCrop.width = 1;
        if (updatedDisplayCrop.height < 1) updatedDisplayCrop.height = 1;

        setCompletedCrop(updatedDisplayCrop);
        return updatedDisplayCrop;
      });
    }
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

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // using natural dimensions for good quality crop result
    const cropWidthValue = completedCrop.width * scaleX;
    const cropHeightValue = completedCrop.height * scaleY;

    canvas.width = Math.max(1, cropWidthValue);
    canvas.height = Math.max(1, cropHeightValue);

    ctx.drawImage(
      image,
      // scaleX and scaleY means drawing the cropped area at original resolution
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidthValue,
      cropHeightValue,
      0,
      0,
      cropWidthValue,
      cropHeightValue
    );

    setCroppedImage(canvas.toDataURL(fileType));
  }, [imageSrc, completedCrop, fileType]);

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
        width: displayWidth,
        height: displayHeight,
      } = imageElement;

      const resetAspect =
        aspectRatio === "free"
          ? 1 / 1
          : parseFloat(aspectRatio.split(":")[0]) /
              parseFloat(aspectRatio.split(":")[1]) || 1 / 1;

      const newPercentCrop = centerAspectCrop(
        naturalWidth,
        naturalHeight,
        resetAspect
      );

      const displayPixelCropForCropState = convertToPixelCrop(
        newPercentCrop,
        displayWidth,
        displayHeight
      );
      setCrop(displayPixelCropForCropState);

      if (displayWidth > 0 && displayHeight > 0) {
        const displayEquivalentResetCrop = convertToPixelCrop(
          newPercentCrop,
          displayWidth,
          displayHeight
        );
        setCompletedCrop(displayEquivalentResetCrop);
        updateSidebarInputs(displayEquivalentResetCrop);
      } else {
        setCompletedCrop(undefined);
        updateSidebarInputs(undefined);
      }
    }
    setAspectRatio("free");
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex md:flex-row h-screen bg-background overflow-hidden">
        {/* Sidebar */}
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
                value={cropWidth}
                onChange={(e) =>
                  handleCropDimensionChange(e.target.value, "width")
                }
                placeholder="px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={cropHeight}
                onChange={(e) =>
                  handleCropDimensionChange(e.target.value, "height")
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
                    if (value !== "free") {
                      const parts = value.split(":");
                      if (parts.length === 2) {
                        newAspectVal =
                          parseFloat(parts[0]) / parseFloat(parts[1]);
                      }
                    } else {
                      newAspectVal = naturalWidth / naturalHeight;
                    }
                    const newCenteredPercentCrop = centerAspectCrop(
                      naturalWidth,
                      naturalHeight,
                      newAspectVal || 1
                    );
                    const newCenteredDisplayPixelCrop = convertToPixelCrop(
                      newCenteredPercentCrop,
                      displayWidth,
                      displayHeight
                    );
                    setCrop(newCenteredDisplayPixelCrop);
                    setCompletedCrop(newCenteredDisplayPixelCrop);
                    updateSidebarInputs(newCenteredDisplayPixelCrop);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Form</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
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
                value={positionX}
                onChange={(e) => handleCropDimensionChange(e.target.value, "x")}
                placeholder="px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-y">Position (Y)</Label>
              <Input
                id="position-y"
                value={positionY}
                onChange={(e) => handleCropDimensionChange(e.target.value, "y")}
                placeholder="px"
              />
            </div>
          </div>
        </div>

        {/* Overlay for mobile hamburger menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto md:justify-center md:h-auto">
          <div className="p-2 md:hidden sticky top-0 bg-background z-20 flex items-center">
            <Button
              variant="ghost"
              ref={hamburgerMenuRef}
              size="icon"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (showTutorial) handleNextTutorialStep();
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
                          className="relative w-full flex-1 flex items-center justify-center bg-[rgba(0,0,0,0.3)] min-h-[300px]"
                        >
                          {" "}
                          <ReactCrop
                            crop={crop}
                            onChange={onCropChange}
                            onComplete={handleCropComplete}
                            aspect={
                              aspectRatio === "free"
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
interface TutorialOverlayProps {
  step: number;
  isMobile: boolean;
  targetRefs: {
    fileInput?: React.RefObject<HTMLDivElement | null>;
    hamburgerMenu?: React.RefObject<HTMLButtonElement | null>;
    cropArea?: React.RefObject<HTMLDivElement | null>;
    generatePreviewButton?: React.RefObject<HTMLButtonElement | null>;
    previewTabTrigger?: React.RefObject<HTMLButtonElement | null>;
    downloadLink?: React.RefObject<HTMLAnchorElement | null>;
  };
  onNext: () => void;
  onSkip: () => void;
  isMobileMenuOpen?: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  isMobile,
  targetRefs,
  onNext,
  onSkip,
  isMobileMenuOpen,
}) => {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({});
  const [content, setContent] = useState<{
    title: string;
    text: string;
    button: string;
  }>({ title: "", text: "", button: "Next" });

  useEffect(() => {
    let tempContentDetails = { title: "", text: "", button: "Next" };

    if (step === 0) {
      tempContentDetails = {
        title: "Welcome to Aurora!",
        text: "This quick tour will show you around.",
        button: "Start Tour",
      };
    } else {
      if (isMobile && step === 1) {
        tempContentDetails = {
          title: "Navigation",
          text: "Tap here to open controls.",
          button: "Next",
        };
      } else if (step === 2) {
        tempContentDetails = {
          title: "Select Image",
          text: "Choose an image. Or, click Next for a sample.",
          button: "Next",
        };
      } else if (step === 3) {
        tempContentDetails = {
          title: "Crop Your Image",
          text: "Adjust the crop here or use sidebar controls.",
          button: "Next",
        };
      } else if (step === 4) {
        tempContentDetails = {
          title: "Preview Crop",
          text: "Happy with the selection? Click to generate a preview.",
          button: "Next",
        };
      } else if (step === 5) {
        tempContentDetails = {
          title: "View Preview",
          text: "In this tab, you can view your crop, and if you're happy with it, download the resulting image.",
          button: "Next",
        };
      } else if (step === 6) {
        tempContentDetails = {
          title: "Download",
          text: "Click here to download your image.",
          button: "Got it!",
        };
      }
    }

    setContent(tempContentDetails);

    const calculateAndSetVisualStyles = () => {
      let localCurrentTargetRef:
        | React.RefObject<HTMLElement | null>
        | undefined;
      if (isMobile && step === 1) {
        localCurrentTargetRef = targetRefs.hamburgerMenu;
      } else if (step === 2) {
        localCurrentTargetRef = targetRefs.fileInput;
      } else if (step === 3) {
        localCurrentTargetRef = targetRefs.cropArea;
      } else if (step === 4) {
        localCurrentTargetRef = targetRefs.generatePreviewButton;
      } else if (step === 5) {
        localCurrentTargetRef = targetRefs.previewTabTrigger;
      } else if (step === 6) {
        localCurrentTargetRef = targetRefs.downloadLink;
      }

      if (step === 0) {
        setHighlightStyle({
          position: "fixed",
          top: "0px",
          left: "0px",
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.65)",
          zIndex: 10000,
          pointerEvents: "auto",
          transition: "all 0.3s ease-in-out",
          border: "none",
          boxShadow: "none",
        });
        setTextStyle({
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          background: "var(--card)",
          color: "var(--card-foreground)",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          zIndex: 10001,
          textAlign: "center",
          border: "1px solid var(--border)",
          minWidth: "280px",
        });
      } else if (localCurrentTargetRef?.current) {
        const rect = localCurrentTargetRef.current.getBoundingClientRect(); //

        if (
          rect.width === 0 &&
          rect.height === 0 &&
          rect.x === 0 &&
          rect.y === 0 &&
          step > 0
        ) {
          setHighlightStyle({
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.65)",
            zIndex: 10000,
            pointerEvents: "none",
            transition: "all 0.3s ease-in-out",
            border: "none",
            boxShadow: "none",
          });
          setTextStyle({ display: "none" });
          return;
        }

        const padding = 5;
        const newHighlightStyleVal: React.CSSProperties = {
          position: "fixed",
          top: `${rect.top - padding}px`,
          left: `${rect.left - padding}px`,
          width: `${rect.width + padding * 2}px`,
          height: `${rect.height + padding * 2}px`,
          border: "3px solid var(--primary)",
          borderRadius: "8px",
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.65)`,
          background: "transparent",
          pointerEvents: "none",
          transition: "all 0.3s ease-in-out",
          zIndex: 10000,
        };

        const textTop = rect.bottom + padding * 2 + 10;
        const textLeft = rect.left + rect.width / 2;
        const newTextStyleVal: React.CSSProperties = {
          position: "fixed",
          padding: "15px",
          background: "var(--card)",
          color: "var(--card-foreground)",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 10001,
          minWidth: "250px",
          maxWidth: "320px",
          border: "1px solid var(--border)",
          transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
          top: `${textTop}px`,
          left: `${textLeft}px`,
          transform: "translateX(-50%)",
        };

        const approxTextboxHeight = 120;
        if (textTop + approxTextboxHeight > window.innerHeight) {
          newTextStyleVal.top = `${rect.top - padding * 2 - 10}px`;
          newTextStyleVal.transform = "translateX(-50%) translateY(-100%)";
        }
        if (rect.left + rect.width / 2 < 160) {
          newTextStyleVal.left = `${Math.max(padding, rect.left)}px`;
          newTextStyleVal.transform = "translateX(0)";
        } else if (window.innerWidth - (rect.left + rect.width / 2) < 160) {
          newTextStyleVal.left = `${Math.min(
            window.innerWidth - padding,
            rect.right
          )}px`;
          newTextStyleVal.transform = "translateX(-100%)";
        }

        setHighlightStyle(newHighlightStyleVal);
        setTextStyle(newTextStyleVal);
      } else if (step > 0) {
        setHighlightStyle({
          position: "fixed",
          top: "0px",
          left: "0px",
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.65)",
          zIndex: 10000,
          pointerEvents: "none",
          transition: "all 0.3s ease-in-out",
          border: "none",
          boxShadow: "none",
        });
        setTextStyle({ display: "none" });
      }
    };

    // some hacky delay shit to hope and pray that the highlight works correctly,  similar to basically everything above
    let delay = 0;
    if (step === 5) {
      delay = 150;
    } else if (isMobile && step === 2) {
      delay = 350;
    }

    if (delay > 0) {
      const timerId = setTimeout(calculateAndSetVisualStyles, delay);
      return () => clearTimeout(timerId);
    } else {
      calculateAndSetVisualStyles();
    }
  }, [step, isMobile, targetRefs, isMobileMenuOpen]);

  if (!content.title && step !== 0) return null;

  return (
    <>
      <div style={highlightStyle} />{" "}
      <div style={textStyle}>
        <h4
          style={{
            marginTop: 0,
            marginBottom: "10px",
            fontSize: "1.2em",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          {content.title}
        </h4>
        <p
          style={{
            margin: "0 0 15px 0",
            fontSize: "0.95em",
            color: "var(--muted-foreground)",
          }}
        >
          {content.text}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {step !== 0 && (
            <Button
              variant="ghost"
              onClick={onSkip}
              style={{ paddingLeft: 0, color: "var(--muted-foreground)" }}
            >
              Skip Tutorial
            </Button>
          )}
          {step === 0 && <div style={{ flex: 1 }}></div>}{" "}
          <Button onClick={onNext}>{content.button}</Button>
        </div>
      </div>
    </>
  );
};

export default App;
