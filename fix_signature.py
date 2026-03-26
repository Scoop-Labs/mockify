from PIL import Image

def make_white_transparent(image_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Any pixel that is close to white, make it transparent
    for item in datas:
        # Check if the pixel is bright (e.g. > 200 in R, G, B)
        # Signature is black, so it will be < 100 usually
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save("/Users/shravani/Downloads/Mockify-main 2/public/signature2.png", "PNG")
    print("Made signature transparent!")

try:
    make_white_transparent("/Users/shravani/Downloads/Mockify-main 2/public/signature2.png")
except Exception as e:
    print(f"Error: {e}")
