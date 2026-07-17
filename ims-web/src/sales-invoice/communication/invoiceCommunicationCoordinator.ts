import { findAccountByName } from '../../api/accounts';
import { getCommunicationSettings, getEnabledChannels, hasAnyChannelEnabled } from '../../api/communicationSettings';
import type {
  CommunicationDeliveryResult,
  InvoiceCommunicationChoice,
  InvoiceCommunicationContext,
} from '../../types/communication';
import { formatDeliverySummary, sendInvoiceCommunication } from './communicationEngine';

export interface InvoiceCommunicationCoordinatorDeps {
  requestChoice: (
    channels: InvoiceCommunicationChoice['channels'],
    sendByDefault: boolean,
  ) => Promise<InvoiceCommunicationChoice | null>;
  showDeliverySummary: (summary: string, allOk: boolean, anyOk: boolean) => void;
}

/** WPF: InvoiceCommunicationCoordinator.HandleAfterSaveAsync */
export async function handleInvoiceCommunicationAfterSave(
  contextInput: InvoiceCommunicationContext,
  deps: InvoiceCommunicationCoordinatorDeps,
): Promise<void> {
  const settings = await getCommunicationSettings();
  if (!hasAnyChannelEnabled(settings)) return;

  const account = await findAccountByName(contextInput.partyName, 'customer');
  const context: InvoiceCommunicationContext = {
    ...contextInput,
    partyEmail: account?.email ?? contextInput.partyEmail,
    partyPhone: account?.mobileNo || account?.contactNo || contextInput.partyPhone,
  };

  const enabled = [...getEnabledChannels(settings)];
  let choice: InvoiceCommunicationChoice;

  if (settings.promptBeforeSend) {
    const dialogChoice = await deps.requestChoice(enabled, settings.sendAfterSaveByDefault);
    if (!dialogChoice?.send) return;
    choice = dialogChoice;
  } else if (!settings.sendAfterSaveByDefault) {
    return;
  } else {
    choice = { send: true, channels: enabled };
  }

  const channels = choice.channels.length > 0 ? choice.channels : enabled;
  if (channels.length === 0) return;

  const results = await sendInvoiceCommunication(context, channels, settings);
  if (results.length === 0) return;
  const summary = formatDeliverySummary(results);
  deps.showDeliverySummary(
    summary,
    results.every((r) => r.success),
    results.some((r) => r.success),
  );
}
