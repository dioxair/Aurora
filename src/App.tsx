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
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const fileInputContainerRef = useRef<HTMLDivElement>(null);
  const hamburgerMenuRef = useRef<HTMLButtonElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const generatePreviewButtonRef = useRef<HTMLButtonElement>(null);
  const previewTabTriggerRef = useRef<HTMLButtonElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const updateSidebarInputsCallback = useCallback(
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
    },
    [imgRef]
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
    updateSidebarInputs: updateSidebarInputsCallback,
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

    if (!crop || (imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial)) {
      let initialAspect = 1 / 1;
      if (
        aspectRatio !== "free" &&
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
      setCrop(newPercentCrop);
      if (
        (imageSrc === DUMMY_IMAGE_URL_FOR_CHECK && showTutorial) ||
        !completedCrop
      ) {
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

  const updateSidebarInputs = updateSidebarInputsCallback;

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

  const handleRestartTutorial = () => {
    localStorage.removeItem("auroraTutorialCompleted");
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const handleGitHubRepoVisit = () => {
    window.open("https://github.com/dioxair/Aurora");
  };

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

export default App;
