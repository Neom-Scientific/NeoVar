'use client'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from "@/components/ui/label"
import { useForm } from 'react-hook-form'

export default function DebugPage() {
  const form = useForm({ defaultValues: { email: '' } })

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Shadcn Components</h1>

      <Form {...form}>
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input {...field} />
            </FormItem>
          )}
        />
      </Form>

      <Button className="mt-4">Submit</Button>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Debug Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Dialog open>
        <DialogContent>
          <DialogTitle>Debug Dialog</DialogTitle>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="tab1" className="mt-4">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">This is tab 1</TabsContent>
      </Tabs>

      <Label className="block mt-4">Debug Label</Label>
    </div>
  )
}
