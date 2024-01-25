# Colorama
### Mapping the past in true color

**Colorama** lets you explore true color photographs from the early 20th century on an interactive map.

Before WWII, color photography was too expensive and cumbersome for mass adoption. But a handful of enthusiasts had been experimenting with early color processes since the turn of the century. **Colorama** is a showcase of their work.

The first batch of photos featured on **Colorama** comes from the [Archives of the Planet](https://en.wikipedia.org/wiki/The_Archives_of_the_Planet) collected by [](https://en.wikipedia.org/wiki/Albert_Kahn_(banker))Albert Kahn. Between 1908 and 1931 Kahn sent photographers around the globe to capture a disappearing world in vibrant color using the [Autochrome process](https://en.wikipedia.org/wiki/Autochrome_Lumi%C3%A8re). I will add more collections from other sources soon.

The [Musée Départemental Albert-Kahn](https://albert-kahn.hauts-de-seine.fr/) has digitized Kahn's collection of more than 60,000 autochrome photos and also published the geolocation data for 50,000 of those photos as an [open dataset](https://opendata.hauts-de-seine.fr/explore/dataset/archives-de-la-planete/information/).

I enhanced the open dataset by applying AI models to the metadata. For non-georeferenced photos I used Large Language Models (LLMs) to extract precise location information from the captions which could be processed by a geocoder. I also used LLMs to translate the captions from French to English.