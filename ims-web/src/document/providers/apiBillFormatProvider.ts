import {
  fetchDefaultSalesBillTemplate,
  listSalesBillTemplates,
  resolveSalesBillTemplate,
  type SalesBillTemplateDto,
} from '../../api/salesBillTemplates';
import { FALLBACK_BILL_TEMPLATES, getFallbackDefaultTemplate } from '../catalog/defaultBillLayouts';
import type { BillFormatDefinition, BillFormatKey, BillFormatResolveRequest, BillFormatSummary } from '../contracts/billFormat';
import type { BillLayoutJson } from '../contracts/billLayout';
import type { DocumentTypeKey } from '../contracts/documentTypes';
import { normalizeBillLayoutJson } from '../renderers/normalizeBillLayout';
import type { BillFormatProvider } from './types';
import { billFormatKeyForDocumentType, stubBillFormatProvider } from './stubBillFormatProvider';

function templateKeyToFormatKey(templateKey: string): BillFormatKey {
  const key = templateKey.trim().toLowerCase();
  if (key === 'thermal') return 'thermal';
  if (key === 'gst_invoice') return 'gst';
  if (key === 'custom') return 'custom';
  return 'standard';
}

function pageSizeFromLayout(layout: BillLayoutJson | undefined): BillFormatDefinition['pageSizeKey'] {
  const sizeKey = layout?.page?.sizeKey;
  if (sizeKey === 'Thermal80' || sizeKey === 'Thermal58' || sizeKey === 'A5' || sizeKey === 'A4') {
    return sizeKey;
  }
  return 'A4';
}

function resolveDocTypeForTemplate(template: SalesBillTemplateDto, fallback: DocumentTypeKey): DocumentTypeKey {
  const fromList = template.appliesToDocTypes?.find((d) => d) as DocumentTypeKey | undefined;
  return (template.transactionType as DocumentTypeKey) || fromList || fallback;
}

function templateToDefinition(
  template: SalesBillTemplateDto,
  source: 'api' | 'fallback',
  docType: DocumentTypeKey,
): BillFormatDefinition {
  const printSettings = template.printSettings ?? {};
  const layoutJson =
    normalizeBillLayoutJson(template.layoutJson, docType) ??
    (source === 'fallback' ? getFallbackDefaultTemplate(docType).layoutJson : undefined);
  return {
    formatKey: templateKeyToFormatKey(template.templateKey),
    templateKey: template.templateKey,
    name: template.name,
    layoutVersion: template.version ?? layoutJson?.version ?? 1,
    pageSizeKey: pageSizeFromLayout(layoutJson),
    printPreview: printSettings.printPreview !== false,
    autoPrintAfterSave: printSettings.autoPrintAfterSave === true,
    layoutJson,
    visibilityRules: template.visibilityRules,
    printSettings,
    source,
  };
}

function fallbackTemplateToDto(docType: DocumentTypeKey): SalesBillTemplateDto {
  const fb = getFallbackDefaultTemplate(docType);
  return {
    id: `fallback-${fb.templateKey}`,
    templateKey: fb.templateKey,
    formatCode: fb.templateKey.toUpperCase(),
    transactionType: docType,
    name: fb.name,
    description: fb.description,
    appliesToDocTypes: fb.appliesToDocTypes,
    isSystem: true,
    isDefault: fb.isDefault,
    isActive: true,
    printSettings: { printPreview: true, autoPrintAfterSave: false },
    visibilityRules: {},
    layoutJson: fb.layoutJson,
    version: fb.layoutJson.version,
  };
}

function fallbackSummaries(documentType: DocumentTypeKey): BillFormatSummary[] {
  return FALLBACK_BILL_TEMPLATES.filter((t) => t.appliesToDocTypes.includes(documentType)).map((t) => ({
    formatKey: templateKeyToFormatKey(t.templateKey),
    templateKey: t.templateKey,
    name: t.name,
    description: t.description,
    isDefault: t.isDefault,
    appliesToDocTypes: t.appliesToDocTypes,
  }));
}

async function resolveFromApi(request: BillFormatResolveRequest): Promise<BillFormatDefinition | null> {
  const { documentType, document, preferredFormatKey, partyAccountCode } = request;
  const partyCode = partyAccountCode ?? document.buyer.accountCode;

  if (preferredFormatKey) {
    const match = FALLBACK_BILL_TEMPLATES.find(
      (t) => templateKeyToFormatKey(t.templateKey) === preferredFormatKey && t.appliesToDocTypes.includes(documentType),
    );
    if (match) {
      return templateToDefinition(
        {
          ...fallbackTemplateToDto(documentType),
          templateKey: match.templateKey,
          name: match.name,
          description: match.description,
          layoutJson: match.layoutJson,
        },
        'fallback',
        documentType,
      );
    }
    const templates = await listSalesBillTemplates();
    const apiMatch = templates.find(
      (t) =>
        templateKeyToFormatKey(t.templateKey) === preferredFormatKey &&
        t.appliesToDocTypes.includes(documentType),
    );
    if (apiMatch) {
      return templateToDefinition(apiMatch, 'api', resolveDocTypeForTemplate(apiMatch, documentType));
    }
  }

  const resolved = await resolveSalesBillTemplate({
    docTypeKey: documentType,
    partyCode,
    accountType: 'customer',
  });
  if (resolved?.template) {
    return templateToDefinition(
      resolved.template,
      'api',
      resolveDocTypeForTemplate(resolved.template, documentType),
    );
  }

  const defaultTemplate = await fetchDefaultSalesBillTemplate(documentType);
  if (defaultTemplate) {
    return templateToDefinition(
      defaultTemplate,
      'api',
      resolveDocTypeForTemplate(defaultTemplate, documentType),
    );
  }

  return null;
}

/** WPF: SalesBillTemplateService + BillFormatPrintResolver */
export const apiBillFormatProvider: BillFormatProvider = {
  name: 'api-bill-format',

  async listFormats(documentType: DocumentTypeKey) {
    const remote = await listSalesBillTemplates();
    if (remote.length === 0) {
      return fallbackSummaries(documentType);
    }
    return remote
      .filter((t) => t.appliesToDocTypes.includes(documentType))
      .map((t) => ({
        formatKey: templateKeyToFormatKey(t.templateKey),
        templateKey: t.templateKey,
        name: t.name,
        description: t.description,
        isDefault: t.isDefault,
        appliesToDocTypes: t.appliesToDocTypes as DocumentTypeKey[],
      }));
  },

  async resolveFormat(request: BillFormatResolveRequest): Promise<BillFormatDefinition> {
    const fromApi = await resolveFromApi(request);
    if (fromApi?.layoutJson) {
      return fromApi;
    }

    const fallback = templateToDefinition(
      fallbackTemplateToDto(request.documentType),
      'fallback',
      request.documentType,
    );
    if (fallback.layoutJson) {
      return fallback;
    }

    return stubBillFormatProvider.resolveFormat(request);
  },
};

export { billFormatKeyForDocumentType, templateKeyToFormatKey };
