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
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // only set initial crop if no crop exists
    if (!crop) {
      const newCrop = centerAspectCrop(naturalWidth, naturalHeight, 4 / 3);
      setCrop(newCrop);
      setCompletedCrop(
        convertToPixelCrop(newCrop, naturalWidth, naturalHeight)
      );
    }
  };

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

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

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Anoko</CardTitle>
            <CardDescription>
              Easily crop your images locally and privately, with a modern UI.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
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
                  <Input type="file" accept="image/*" onChange={onFileChange} />
                  {imageSrc && (
                    <div className="relative w-full">
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={handleCropComplete}
                        aspect={4 / 3}
                        className="h-full w-full"
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
                          className="h-full w-full object-contain"
                          alt="Crop preview"
                        />
                      </ReactCrop>
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
                      <div className="relative w-full border rounded-lg overflow-hidden">
                        <img
                          src={croppedImage}
                          className="w-full h-full object-contain"
                          alt="Cropped preview"
                        />
                      </div>
                      <Button asChild className="w-full">
                        <a href={croppedImage} download={getDownloadFileName()}>
                          Download Image
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Alert>
                      <AlertTitle>No Preview Available</AlertTitle>
                      <AlertDescription>
                        Crop an image first and click "Generate Preview" to see
                        the result here.
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
    </ThemeProvider>
  );
}

export default App;
