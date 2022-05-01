export interface IConfig {
  initialTag: string;
  tags: string[];
  term: string;
}

export const defaultConfig: IConfig = {
  initialTag: "1",
  tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  term: "xterm",
};
