import { DbankPage } from './app.po';

describe('dbank App', () => {
  let page: DbankPage;

  beforeEach(() => {
    page = new DbankPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
