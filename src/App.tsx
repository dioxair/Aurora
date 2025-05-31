import "./App.css";
import { useState, useCallback, useRef } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
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
  const imgRef = useRef<HTMLImageElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setCrop(undefined);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    const newCrop = centerAspectCrop(naturalWidth, naturalHeight, 4 / 3);
    setCrop(newCrop);

    setCompletedCrop(convertToPixelCrop(newCrop, naturalWidth, naturalHeight));
  };

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);
  }, []);

  const handleCropImage = useCallback(async () => {
    if (!imageSrc || !completedCrop || !imgRef.current) return;
    console.log("Cropped area in pixels:", completedCrop);
  }, [imageSrc, completedCrop]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Anoko</CardTitle>
            <CardDescription>
              Easily crop and resize your images locally and privately, with a
              modern UI.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
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
              <Button onClick={handleCropImage} disabled={!imageSrc || !crop}>
                Crop Image
              </Button>
            </div>
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
