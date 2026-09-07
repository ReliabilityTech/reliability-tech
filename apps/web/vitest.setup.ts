import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// A limpeza automática do RTL só se registra sozinha quando `afterEach` é
// global (Jest, ou vitest com `test.globals: true`) — como os specs importam
// `afterEach` explicitamente, sem isso o DOM de um `render()' fica no body
// pro teste seguinte, e uma 2ª asserção por texto vira "multiple elements".
afterEach(cleanup);

// jsdom não implementa <dialog> (showModal/close viram no-op silencioso e
// deixam o elemento sem o atributo `open`) — os diálogos do app dependem
// desse atributo pra decidir o que está visível, então sem isso toda
// asserção em cima do conteúdo do <dialog> falharia mesmo com o app correto.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
  };
}
