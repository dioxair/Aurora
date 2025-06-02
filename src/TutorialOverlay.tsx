import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface TutorialOverlayProps {
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

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
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
        const rect = localCurrentTargetRef.current.getBoundingClientRect();

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
