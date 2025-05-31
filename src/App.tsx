import "./App.css";
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
                {/* Add more tabs as needed */}
              </TabsList>
              <TabsContent value="crop">
                <div className="flex flex-col gap-4">
                  <Input type="file" accept="image/*" />
                  {/* Image preview and cropper UI will go here */}
                  <Button>Crop Image</Button>
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
