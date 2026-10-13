export interface ArtworkSample {
  id: string;
  imageName: string;
  src: string;
}

export interface AnalysisData {
  knowledgePoints: {
    title: string;
    evidence: string;
    examPoint: string;
    practice: string;
  }[];
  note: {
    title: string;
    content: string;
    tags: string[];
  };
  hook: string;
}

export interface AnalysisResultData extends AnalysisData {
  id: string;
  imageName: string;
}

export interface LocalImage {
  src: string;
  name: string;
  sizeLabel: string;
  kind: "sample" | "upload";
}
