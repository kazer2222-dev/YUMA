export const formatDateDDMMYYYY = (dateString: string): string => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getTaskPriorityClasses = (priority: string) => {
  switch (priority) {
    case 'HIGHEST':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'LOWEST':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const allowedDescriptionTags = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'BR',
  'UL',
  'OL',
  'LI',
  'P',
  'SPAN',
  'CODE',
  'PRE',
  'BLOCKQUOTE',
  'H1',
  'H2',
  'H3',
  'H4',
  'A',
  'LABEL',
  'INPUT',
  'DIV',
]);

const allowedDescriptionAttributes: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'target', 'rel']),
  UL: new Set(['data-type', 'class']),
  LI: new Set(['data-type', 'data-checked', 'class']),
  LABEL: new Set(['class', 'contenteditable']),
  INPUT: new Set(['type', 'checked', 'disabled', 'contenteditable']),
  SPAN: new Set(['class', 'style']),
  P: new Set(['class']),
  DIV: new Set(['class']),
};

const globalAllowedAttributes = new Set<string>(['data-type', 'data-checked', 'class']);

export const sanitizeDescriptionHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sanitizeNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!allowedDescriptionTags.has(el.tagName)) {
          sanitizeNode(el);
          const fragment = document.createDocumentFragment();
          while (el.firstChild) {
            fragment.appendChild(el.firstChild);
          }
          el.replaceWith(fragment);
          return;
        }

        const allowedAttrs = allowedDescriptionAttributes[el.tagName] || globalAllowedAttributes;

        Array.from(el.attributes).forEach((attr) => {
          const attrName = attr.name.toLowerCase();
          if (attrName.startsWith('data-') || allowedAttrs.has(attrName) || globalAllowedAttributes.has(attrName)) {
            return;
          }
          el.removeAttribute(attr.name);
        });

        if (el.tagName === 'A') {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noreferrer noopener');
        }

        if (el.tagName === 'INPUT' && el.getAttribute('type') === 'checkbox') {
          el.setAttribute('disabled', 'true');
          el.setAttribute('readonly', 'true');
        }

        sanitizeNode(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    });
  };

  sanitizeNode(doc.body);
  return doc.body.innerHTML.trim();
};


