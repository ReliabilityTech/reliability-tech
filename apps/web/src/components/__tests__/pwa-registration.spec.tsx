import type { UserRole } from '@arbora/contracts';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PwaRegistration } from '../pwa-registration';

// Passado como variável, não como literal JSX — `role="RESPONSAVEL"` direto
// dispara jsx-a11y/aria-role (a regra não distingue prop de componente de
// atributo ARIA de elemento HTML; só ignora quando o valor não é um literal).
const RESPONSAVEL: UserRole = 'RESPONSAVEL';

describe('PwaRegistration', () => {
  const registerMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    registerMock.mockClear();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('registra o service worker quando o papel é RESPONSAVEL', () => {
    render(<PwaRegistration role={RESPONSAVEL} />);
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it.each(['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'SUPER_ADMIN'] as const)(
    'não registra o service worker pro papel %s',
    (role) => {
      render(<PwaRegistration role={role} />);
      expect(registerMock).not.toHaveBeenCalled();
    },
  );

  it('não quebra quando o navegador não suporta service worker', () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    expect(() => render(<PwaRegistration role={RESPONSAVEL} />)).not.toThrow();
  });
});
