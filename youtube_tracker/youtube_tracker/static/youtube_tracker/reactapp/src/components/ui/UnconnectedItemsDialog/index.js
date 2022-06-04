import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dialog, DialogActions, DialogContent, Typography } from '@material-ui/core';

import { FileDataStoreContext, UiStoreContext, VisualizationStoreContext, WebworkerStoreContext } from 'store/stores';

const UnconnectedItemsDialog = observer(() => {
  const fileDataStore = useContext(FileDataStoreContext);
  const uiStore = useContext(UiStoreContext);
  const visualizationStore = useContext(VisualizationStoreContext);
  const webworkerStore = useContext(WebworkerStoreContext);

  const exitUnconnectedItemsDialogYes = () => {
    webworkerStore.startHandleUnconnectedItems({ unconnectedItemsDialogChoice: 'yes', mapData: fileDataStore.mapData, networkData: fileDataStore.networkData, itemIdToIndex: visualizationStore.itemIdToIndex });
    uiStore.setUnconnectedItemsDialog(false);
    uiStore.setUnconnectedItemsDialogIsOpen(false);
  };

  const exitUnconnectedItemsDialogNo = () => {
    webworkerStore.startHandleUnconnectedItems({ unconnectedItemsDialogChoice: 'no', mapData: fileDataStore.mapData, networkData: fileDataStore.networkData, itemIdToIndex: visualizationStore.itemIdToIndex });
    uiStore.setUnconnectedItemsDialog(false);
    uiStore.setUnconnectedItemsDialogIsOpen(false);
  };

  return (
    <Dialog
      open={uiStore.unconnectedItemsDialogIsOpen}
    >
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {`Preview content in this graph`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          autoFocus
          onClick={exitUnconnectedItemsDialogYes}
        >
          Yes
        </Button>
        <Button
          color="primary"
          onClick={exitUnconnectedItemsDialogYes}
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default UnconnectedItemsDialog;
