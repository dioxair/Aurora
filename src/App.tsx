import "./App.css";
import { useState, useCallback, useRef } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  type ReactCropState,
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setFileType(file.type);
        setOriginalFileName(file.name);
        setCrop(undefined);
        setCroppedImage(null);
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

    let initialAspect = 1 / 1;
    if (aspectRatio !== "free") {
      const parts = aspectRatio.split(":");
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          initialAspect = num / den;
        }
      }
    }

    const newPercentCrop = centerAspectCrop(
      naturalWidth,
      naturalHeight,
      initialAspect
    );
    setCrop(newPercentCrop);

    if (displayWidth > 0 && displayHeight > 0) {
      const initialDisplayPixelCrop = convertToPixelCrop(
        newPercentCrop,
        displayWidth,
        displayHeight
      );
      setCompletedCrop(initialDisplayPixelCrop);
    } else {
      setCompletedCrop(undefined);
      updateSidebarInputs(undefined);
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
      // scale factors :fireinthehole:
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

  const onCropChange = (displayPixelCrop: PixelCrop, percentCrop: Crop) => {
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
      crop
    ) {
      // crop here is the current crop for the display image

      const imageElement = imgRef.current;
      const scaleX = imageElement.naturalWidth / imageElement.width;
      const scaleY = imageElement.naturalHeight / imageElement.height;

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
          newDisplayPixelValues.width = naturalNumericValue / scaleX;
        else if (dimension === "height")
          newDisplayPixelValues.height = naturalNumericValue / scaleY;
        else if (dimension === "x")
          newDisplayPixelValues.x = naturalNumericValue / scaleX;
        else if (dimension === "y")
          newDisplayPixelValues.y = naturalNumericValue / scaleY;

        const updatedDisplayCrop = {
          ...currentDisplayPixelCrop,
          ...newDisplayPixelValues,
        } as PixelCrop;

        // here comes a bunch of shit to clamp width and height to the actual image, so fun!!!
        const displayWidth = imageElement.width;
        const displayHeight = imageElement.height;

        updatedDisplayCrop.x = Math.max(0, updatedDisplayCrop.x);
        updatedDisplayCrop.y = Math.max(0, updatedDisplayCrop.y);
        updatedDisplayCrop.width = Math.max(0, updatedDisplayCrop.width);
        updatedDisplayCrop.height = Math.max(0, updatedDisplayCrop.height);

        if (updatedDisplayCrop.x + updatedDisplayCrop.width > displayWidth) {
          updatedDisplayCrop.width = displayWidth - updatedDisplayCrop.x;
        }
        if (updatedDisplayCrop.y + updatedDisplayCrop.height > displayHeight) {
          updatedDisplayCrop.height = displayHeight - updatedDisplayCrop.y;
        }

        if (updatedDisplayCrop.width < 0) updatedDisplayCrop.width = 0;
        if (updatedDisplayCrop.height < 0) updatedDisplayCrop.height = 0;

        updatedDisplayCrop.x = Math.min(
          updatedDisplayCrop.x,
          displayWidth - updatedDisplayCrop.width
        );
        updatedDisplayCrop.y = Math.min(
          updatedDisplayCrop.y,
          displayHeight - updatedDisplayCrop.height
        );

        if (updatedDisplayCrop.x < 0) updatedDisplayCrop.x = 0;
        if (updatedDisplayCrop.y < 0) updatedDisplayCrop.y = 0;

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
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      image,
      // scaleX and scaleY means drawing the cropped area at original resolution
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    setCroppedImage(canvas.toDataURL(fileType));
  }, [imageSrc, completedCrop, fileType]);

  const handleCropImage = useCallback(async () => {
    if (!imageSrc || !completedCrop || !imgRef.current) return;
    generateCroppedPreview();
    setTabValue("preview");
  }, [imageSrc, completedCrop, generateCroppedPreview]);

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

      const newPercentCrop = centerAspectCrop(
        naturalWidth,
        naturalHeight,
        1 / 1
      );
      setCrop(newPercentCrop);

      const displayEquivalentResetCrop = convertToPixelCrop(
        newPercentCrop,
        displayWidth,
        displayHeight
      );
      setCompletedCrop(displayEquivalentResetCrop);
      updateSidebarInputs(displayEquivalentResetCrop);
      updateSidebarInputs(undefined);
    }
    setAspectRatio("1:1");
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-64 p-4 border-r flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
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
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
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

          <Button variant="secondary" className="w-full" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
          <Card
            className="w-full max-w-lg"
            style={{ maxHeight: imageSrc ? "none" : "fit-content" }}
          >
            <CardHeader>
              <CardTitle>Anoko</CardTitle>
              <CardDescription>
                Easily crop your images locally and privately, with a modern UI.
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
                  <TabsTrigger value="preview">Preview & Download</TabsTrigger>
                </TabsList>
                <TabsContent value="crop">
                  <div className="flex flex-col gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                    />
                    {imageSrc ? (
                      <div className="relative w-full flex-1 flex items-center justify-center bg-black bg-opacity-10 min-h-[300px]">
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
                          renderSelectionAddon={(state: ReactCropState) => (
                            <div className="react-crop-selection-addon">
                              {/*
                                Vertical and horizontal lines stemming from the crosshair
                                i MIGHT add an option for this later 
                                
                                <div className="crosshair-v" />
                                <div className="crosshair-h" />
        
                                */}
                              <div className="crosshair-dot" />
                            </div>
                          )}
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
                      <div className="flex items-center justify-center bg-black bg-opacity-10 min-h-[200px] rounded-lg">
                        <p className="text-muted-foreground">
                          No image selected
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleCropImage}
                      disabled={!imageSrc || !crop}
                    >
                      Generate Preview
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="flex flex-col gap-4">
                    {croppedImage ? (
                      <>
                        <div className="relative w-full flex-1 flex items-center justify-center bg-black bg-opacity-10 min-h-[300px]">
                          <img
                            src={croppedImage}
                            className="max-h-full max-w-full object-contain"
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
                            download={getDownloadFileName()}
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
    </ThemeProvider>
  );
}

export default App;
