from io import BytesIO
from PIL import Image


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
}

MAX_FILE_SIZE = 10 * 1024 * 1024


async def validate_image(file):
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError(
            "Only JPG, JPEG and PNG images are supported."
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise ValueError(
            "Image size must be less than 10MB."
        )

    try:
        image = Image.open(BytesIO(contents))
        image.verify()
    except Exception:
        raise ValueError("Invalid image file.")

    image = Image.open(BytesIO(contents)).convert("RGB")

    width, height = image.size

    if width < 400 or height < 400:
        raise ValueError(
            "Image resolution is too low. Please upload a clearer image."
        )

    return contents, image