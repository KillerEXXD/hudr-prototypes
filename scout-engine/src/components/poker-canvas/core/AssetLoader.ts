export class AssetLoader {
  private imageCache = new Map<string, HTMLImageElement>()
  private audioCache = new Map<string, ArrayBuffer>()

  async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) return this.imageCache.get(src)!
    const image = new Image()
    image.src = src
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })
    this.imageCache.set(src, image)
    return image
  }

  async loadAudioBuffer(src: string): Promise<ArrayBuffer> {
    if (this.audioCache.has(src)) return this.audioCache.get(src)!
    const response = await fetch(src)
    const buffer = await response.arrayBuffer()
    this.audioCache.set(src, buffer)
    return buffer
  }
}
