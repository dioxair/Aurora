import { useState, useEffect, useCallback } from "react";
import type { Crop, PixelCrop } from "react-image-crop";
import { convertToPixelCrop } from "react-image-crop";

const DUMMY_IMAGE_URL_INTERNAL = "https://picsum.photos/600/400";
const ANOTHER_DUMMY_IMAGE_INTERNAL =
  "https://files.samola.net/r/backup_sample_(image_by_ALPCMAS).jpg";
const DUMMY_FILE_NAME_INTERNAL = "sample-image.jpg";

export const DUMMY_IMAGE_URL_FOR_CHECK = DUMMY_IMAGE_URL_INTERNAL;

interface UseTutorialProps {
  isMobileView: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  imageSrc: string | null;
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setFileType: React.Dispatch<React.SetStateAction<string>>;
  setOriginalFileName: React.Dispatch<React.SetStateAction<string | null>>;
  appCropState: Crop | undefined;
  setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
  appCompletedCropState: PixelCrop | undefined;
  setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
  setCroppedImage: React.Dispatch<React.SetStateAction<string | null>>;
  appTabValue: string;
  setTabValue: React.Dispatch<React.SetStateAction<string>>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  aspectRatio: string;
  updateSidebarInputs: (displayPixelCrop: PixelCrop | undefined) => void;
  triggerHandleCropImage: () => Promise<void>;
  centerAspectCropFn: (
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
  ) => Crop;
  interactionRefs: {
    hamburgerMenuRef: React.RefObject<HTMLButtonElement | null>;
    generatePreviewButtonRef: React.RefObject<HTMLButtonElement | null>;
    previewTabTriggerRef: React.RefObject<HTMLButtonElement | null>;
  };
}

export function useTutorial({
  isMobileView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  imageSrc,
  setImageSrc,
  setFileType,
  setOriginalFileName,
  appCropState,
  setCrop,
  appCompletedCropState,
  setCompletedCrop,
  setCroppedImage,
  appTabValue,
  setTabValue,
  imgRef,
  aspectRatio,
  updateSidebarInputs,
  triggerHandleCropImage,
  centerAspectCropFn,
  interactionRefs,
}: UseTutorialProps) {
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem("auroraTutorialCompleted");
    if (!tutorialCompleted) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const loadDummyImageForTutorial = useCallback(() => {
    if (!imageSrc || showTutorial) {
      fetch(DUMMY_IMAGE_URL_INTERNAL)
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
            setOriginalFileName(DUMMY_FILE_NAME_INTERNAL);
            setCrop(undefined);
            setCompletedCrop(undefined);
            setCroppedImage(null);
            setTabValue("crop");
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error(
            "Error fetching dummy image, falling back to a hardcoded one\nError:",
            error
          );
          fetch(ANOTHER_DUMMY_IMAGE_INTERNAL)
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
                setOriginalFileName(DUMMY_FILE_NAME_INTERNAL);
                setCrop(undefined);
                setCompletedCrop(undefined);
                setCroppedImage(null);
                setTabValue("crop");
              };
              reader.readAsDataURL(blob);
            });
        });
    }
  }, [
    imageSrc,
    showTutorial,
    setImageSrc,
    setFileType,
    setOriginalFileName,
    setCrop,
    setCompletedCrop,
    setCroppedImage,
    setTabValue,
  ]);

  const handleNextTutorialStep = () => {
    const currentStep = tutorialStep;
    const mobile = isMobileView;
    let nextStepState = -1;

    if (currentStep === 0) {
      nextStepState = mobile ? 1 : 2;
    } else if (mobile && currentStep === 1) {
      if (interactionRefs.hamburgerMenuRef.current && !isMobileMenuOpen) {
        interactionRefs.hamburgerMenuRef.current.click();
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
        imageSrc === DUMMY_IMAGE_URL_INTERNAL &&
        !appCropState &&
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
        const initialCrop = centerAspectCropFn(
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
        interactionRefs.generatePreviewButtonRef.current &&
        !interactionRefs.generatePreviewButtonRef.current.disabled
      ) {
        interactionRefs.generatePreviewButtonRef.current.click();
      } else if (imageSrc && (appCropState || appCompletedCropState)) {
        triggerHandleCropImage();
      }
    } else if (currentStep === 5) {
      if (
        interactionRefs.previewTabTriggerRef.current &&
        appTabValue !== "preview"
      ) {
        interactionRefs.previewTabTriggerRef.current.click();
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
    if (imageSrc === DUMMY_IMAGE_URL_INTERNAL) {
      setImageSrc(null);
      setOriginalFileName(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCroppedImage(null);
    }
  };

  return {
    showTutorial,
    setShowTutorial,
    tutorialStep,
    setTutorialStep,
    handleNextTutorialStep,
    handleSkipTutorial,
    loadDummyImageForTutorial,
  };
}
