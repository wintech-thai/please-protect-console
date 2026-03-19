import { JSX, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";

interface ConfirmProps {
  title: string;
  message: string;
  variant: ButtonProps["variant"];
  confirmButton?: string;
  cancelButton?: string;
}

export const useConfirm = ({
  title,
  message,
  variant = "destructive",
  confirmButton,
  cancelButton,
}: ConfirmProps): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const ConfirmationDialog = () => {
    return (
      <Modal onClose={handleCancel} open={!!promise}>
        <ModalContent>
          <ModalHeader>
            {title}
            <ModalClose />
          </ModalHeader>

          <ModalBody>
            <p className="text-sm text-muted-foreground">{message}</p>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelButton}
            </Button>
            <Button type="button" variant={"default"} onClick={handleConfirm}>
              {confirmButton}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return [ConfirmationDialog, confirm];
};
