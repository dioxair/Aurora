import "./App.css";
import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
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

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    console.log("Cropped area in pixels:", croppedAreaPixels);
  }, [imageSrc, croppedAreaPixels]);

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
            <Tabs defaultValue="crop" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="crop">Crop</TabsTrigger>
                <TabsTrigger value="resize">Resize</TabsTrigger>
              </TabsList>
              <TabsContent value="crop">
                <div className="flex flex-col gap-4">
                  <Input type="file" accept="image/*" onChange={onFileChange} />
                  {imageSrc && (
                    <div className="relative h-64 w-full">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="rect"
                        showGrid={true}
                        classes={{
                          containerClassName: "rounded-lg",
                          cropAreaClassName:
                            "border-2 border-dashed border-white",
                        }}
                      />
                    </div>
                  )}
                  <Button onClick={handleCropImage} disabled={!imageSrc}>
                    Crop Image
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="resize">
                <Alert>
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    The resize feature will be available in a future update.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
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
