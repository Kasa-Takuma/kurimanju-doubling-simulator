# 栗饅頭倍増シミュレータ

WebGPUで動作する観察用の3Dシミュレータです。初期版では栗饅頭のGLBがまだ用意されていないため、起動時は同じ寸法の開発用placeholderを表示します。GLBを配置すると、同じInstancing・LOD・物理の経路で読み込みます。

## 起動

```sh
npm install
npm run dev
```

WebGPU対応ブラウザで `http://localhost:5173/` を開いてください。WebGPUが使えない場合はWebGLへ切り替えず、互換性案内を表示します。

## モデルの配置

次の4ファイルを配置するとplaceholderから切り替わります。

```text
public/assets/models/kurimanju/
├── kurimanju_lod0.glb
├── kurimanju_lod1.glb
├── kurimanju_lod2.glb
└── kurimanju_lod3.glb
```

モデルは1 Three.js unitを1mとして、中心付近を原点にしてください。各GLBの最初のMeshを描画用入力として使い、Base Color、Normal、Roughnessを読み込みます。不要なライト、カメラ、アニメーションは含めないでください。

## 操作

- iPad: 1本指で視線回転、2本指で平行移動、ピンチでドリー移動
- デスクトップ: 左ドラッグで視線回転、右ドラッグで平行移動、ホイールでドリー移動
- `D`: Debug HUDの表示切り替え

## 実装上の境界

- Stage Aでは近距離個体をRapierのdynamic rigid bodyとして生成します。
- Stage Bでは近距離の物理個体と、決定論的なチャンク配置によるInstancingを併用します。
- Stage Cでは個数を列挙せず、密度と表面分布から栗饅頭の集団を生成します。
- 個数は通常範囲では正確な整数、巨大化後は世代から計算した科学表記で表示します。
- GTAOはThree.jsのTSL `GTAONode`を使い、Bloom、被写界深度、音声は実装していません。

## 検証

```sh
npm test
npm run build
```

GitHub Pages用のワークフローは `.github/workflows/deploy.yml` にあります。GitHub Actionsではリポジトリ名からViteのbaseを決めます。
