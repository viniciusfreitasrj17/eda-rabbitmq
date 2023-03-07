import express, { Request, Response } from "express"
import cors from "cors"
import { AppDataSource } from "./data-source"
import { Product } from "./entity/product"
import * as amqp from 'amqplib/callback_api'

const app = express()
const PORT = 3000

const bootstrap = async () => {
  const dataSource = await AppDataSource.initialize()
  const productRepository = dataSource.getRepository(Product)

  amqp.connect("amqp://admin:admin@rabbitmq:5672/products", (err, con) => {
    if (err) throw err

    con.createChannel((err, channel) => {
      if (err) throw err

      app.use(cors({}))
      app.use(express.json())
      
      app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find()
        return res.json(products)
      })
    
      app.post('/api/products', async (req: Request, res: Response) => {
        const product = productRepository.create(req.body)
        const result = await productRepository.save(product)
        channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
        return res.json(result)
      })
    
      app.get('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.findOne({ where: { id: parseInt(req.params.id) } })
        return res.json(product)
      })
    
      app.put('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.findOne({ where: { id: parseInt(req.params.id) } })
        if (!product) return res.status(404).send('Product not found')
        productRepository.merge(product, req.body)
        const result = await productRepository.save(product)
        channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
        return res.json(result)
      })
    
      app.delete('/api/products/:id', async (req: Request, res: Response) => {
        const result = await productRepository.delete(req.params.id)
        channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
        return res.json(result)
      })
    
      app.post('/api/products/:id/like', async (req: Request, res: Response) => {
        const product = await productRepository.findOne({ where: { id: parseInt(req.params.id) } })
        if (!product) return res.status(404).send('Product not found')
        product.likes++
        const result = await productRepository.save(product)
        return res.json(result)
      })
      
      app.listen(PORT, async () => {
        console.log(`Listening to port ${PORT}`)
      })

      process.on('beforeExit', () => {
        console.log('RabbitMQ closing...')
        con.close()
      })
    })
  }) 
}

bootstrap()
